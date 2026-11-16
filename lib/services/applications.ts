import { and, asc, count, desc, eq, gte, ne, or, sql } from "drizzle-orm";
import { ilikeContains } from "@/lib/search";
import { applicationEvents, applications, files, jobs, users } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { asDate } from "@/lib/format";
import { fail, isUniqueViolation, ok, type ServiceResult } from "@/lib/result";
import { audit } from "@/lib/services/audit";
import { removeStoredFile, storeResume } from "@/lib/services/files";
import { newId } from "@/lib/services/ids";
import { notify, notifyAdmins, notifyApplicationStatus } from "@/lib/services/notifications";
import { canTransition } from "@/lib/services/transitions";
import type { Application, ApplicationEvent, ApplicationStatus, JobStatus, PublicUser } from "@/lib/types";

export type ApplicationView = Application & {
  jobTitle: string;
  company: string;
  jobStatus: JobStatus;
};

type ApplicationRow = {
  application: typeof applications.$inferSelect;
  jobTitle: string;
  company: string;
  jobStatus: string;
};

function mapApplication(row: ApplicationRow): ApplicationView {
  return {
    id: row.application.id,
    jobId: row.application.jobId,
    candidateUserId: row.application.candidateUserId,
    candidateName: row.application.candidateName,
    email: row.application.email,
    phone: row.application.phone,
    submittedAt: asDate(row.application.submittedAt).toISOString(),
    status: row.application.status as ApplicationStatus,
    coverLetter: row.application.coverLetter,
    details: row.application.details,
    notes: row.application.notes,
    resumeFileId: row.application.resumeFileId,
    jobTitle: row.jobTitle,
    company: row.company,
    jobStatus: row.jobStatus as JobStatus,
  };
}

const applicationSelection = {
  application: applications,
  jobTitle: jobs.title,
  company: jobs.company,
  jobStatus: jobs.status,
};

async function findApplication(db: Database, id: string) {
  const [row] = await db
    .select(applicationSelection)
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, id))
    .limit(1);
  return row ? mapApplication(row) : null;
}

export async function getApplicationForActor(db: Database, actor: PublicUser, id: string) {
  const application = await findApplication(db, id);
  if (!application) return null;
  if (actor.role !== "admin" && application.candidateUserId !== actor.id) return null;
  return application;
}

export async function listCandidateApplications(db: Database, userId: string) {
  const rows = await db
    .select(applicationSelection)
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.candidateUserId, userId))
    .orderBy(desc(applications.submittedAt))
    .limit(500);
  return rows.map(mapApplication);
}

export async function listAdminApplications(
  db: Database,
  actor: PublicUser,
  query: { q?: string; status?: string; page?: number; pageSize?: number },
) {
  if (actor.role !== "admin") {
    return { applications: [], total: 0, page: 1, pageSize: 20 };
  }
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 50);
  const page = Math.min(Math.max(query.page ?? 1, 1), 10000);
  const filters = [];
  if (query.status && query.status !== "All") filters.push(eq(applications.status, query.status));
  if (query.q?.trim()) {
    const parts = [
      ilikeContains(applications.candidateName, query.q),
      ilikeContains(applications.email, query.q),
      ilikeContains(jobs.title, query.q),
      ilikeContains(jobs.company, query.q),
    ].filter((part): part is NonNullable<typeof part> => Boolean(part));
    if (parts.length) filters.push(or(...parts)!);
  }
  const where = filters.length ? and(...filters) : undefined;
  const rows = await db
    .select(applicationSelection)
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(where)
    .orderBy(desc(applications.submittedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db
    .select({ value: count() })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(where);
  return { applications: rows.map(mapApplication), total: Number(totalRow?.value ?? 0), page, pageSize };
}

export async function listEvents(db: Database, applicationId: string): Promise<ApplicationEvent[]> {
  const rows = await db
    .select({
      id: applicationEvents.id,
      fromStatus: applicationEvents.fromStatus,
      toStatus: applicationEvents.toStatus,
      note: applicationEvents.note,
      createdAt: applicationEvents.createdAt,
      actorName: users.name,
    })
    .from(applicationEvents)
    .leftJoin(users, eq(applicationEvents.actorUserId, users.id))
    .where(eq(applicationEvents.applicationId, applicationId))
    .orderBy(asc(applicationEvents.createdAt));
  return rows.map((row) => ({
    id: row.id,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    note: row.note,
    createdAt: asDate(row.createdAt).toISOString(),
    actorName: row.actorName,
  }));
}

export async function submitApplication(
  db: Database,
  user: PublicUser,
  input: { jobId: string; phone: string; coverLetter: string; details: string },
  file: { filename: string; bytes: Buffer; storageDir: string },
): Promise<ServiceResult<{ id: string; jobId: string }>> {
  const stored = await storeResume(db, {
    ownerUserId: user.id,
    filename: file.filename,
    bytes: file.bytes,
    storageDir: file.storageDir,
  });
  if (!stored.ok) return stored;
  try {
    const result = await db.transaction(async (tx) => {
      const database = tx as unknown as Database;
      const [job] = await database.select().from(jobs).where(eq(jobs.id, input.jobId)).for("update").limit(1);
      if (!job || (job.status !== "published" && job.status !== "closed")) {
        return fail("not_found", "This job is no longer available.");
      }
      if (job.status !== "published") return fail("closed", "This job is not accepting applications.");
      const [existing] = await database
        .select({ id: applications.id })
        .from(applications)
        .where(
          and(eq(applications.jobId, job.id), eq(applications.candidateUserId, user.id), ne(applications.status, "Withdrawn")),
        )
        .limit(1);
      if (existing) return fail("duplicate", "You already applied to this job.");
      const id = newId();
      await database.insert(applications).values({
        id,
        jobId: job.id,
        candidateUserId: user.id,
        candidateName: user.name,
        email: user.email,
        phone: input.phone || user.phone,
        coverLetter: input.coverLetter,
        details: input.details,
        resumeFileId: stored.data.id,
        status: "Pending",
        notes: "",
        seeded: false,
      });
      await database.insert(applicationEvents).values({
        id: newId(),
        applicationId: id,
        actorUserId: user.id,
        fromStatus: null,
        toStatus: "Pending",
        note: "Application submitted",
      });
      await notify(database, user.id, "Application received", `Your application for ${job.title} is pending review.`, `/applications/${id}`);
      await notifyAdmins(database, "New application", `${user.name} applied for ${job.title}.`, `/dashboard/applications/${id}`);
      await audit(database, user.id, "application.submit", "application", id, { jobId: job.id });
      return ok({ id, jobId: job.id });
    });
    if (!result.ok) await discardFile(db, stored.data.id, stored.data.storedName, file.storageDir);
    return result;
  } catch (error) {
    await discardFile(db, stored.data.id, stored.data.storedName, file.storageDir);
    if (isUniqueViolation(error)) return fail("duplicate", "You already applied to this job.");
    throw error;
  }
}

async function discardFile(db: Database, fileId: string, storedName: string, storageDir: string) {
  await db.delete(files).where(eq(files.id, fileId));
  await removeStoredFile(storageDir, storedName);
}

export async function changeApplicationStatus(
  db: Database,
  actor: PublicUser,
  applicationId: string,
  to: ApplicationStatus,
  note: string,
  expected: ApplicationStatus,
): Promise<ServiceResult<ApplicationView>> {
  const result = await db.transaction(async (tx) => {
    const database = tx as unknown as Database;
    const [row] = await database.select().from(applications).where(eq(applications.id, applicationId)).for("update").limit(1);
    if (!row) return fail("not_found", "Application not found.");
    if (actor.role !== "admin" && row.candidateUserId !== actor.id) return fail("not_found", "Application not found.");
    const from = row.status as ApplicationStatus;
    if (from !== expected) return fail("conflict", "This application changed. Refresh and try again.");
    if (!canTransition(actor.role, from, to)) {
      return fail("invalid_transition", `Cannot move an application from ${from} to ${to}.`);
    }
    const cleanedNote = note.trim().slice(0, 2000);
    await database
      .update(applications)
      .set({
        status: to,
        notes: actor.role === "admin" ? cleanedNote : row.notes,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, row.id));
    await database.insert(applicationEvents).values({
      id: newId(),
      applicationId: row.id,
      actorUserId: actor.id,
      fromStatus: from,
      toStatus: to,
      note: cleanedNote || `Status changed to ${to}`,
    });
    const [job] = await database.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, row.jobId)).limit(1);
    if (actor.role === "admin") {
      await notifyApplicationStatus(database, row.candidateUserId, row.id, to, job?.title ?? "a role");
    } else {
      await notifyAdmins(
        database,
        "Application withdrawn",
        `${row.candidateName} withdrew from ${job?.title ?? "a role"}.`,
        `/dashboard/applications/${row.id}`,
      );
    }
    await audit(database, actor.id, "application.status", "application", row.id, { from, to });
    return ok(row.id);
  });
  if (!result.ok) return result;
  const application = await findApplication(db, result.data);
  if (!application) return fail("not_found", "Application not found.");
  return ok(application);
}

export async function deleteApplication(
  db: Database,
  actor: PublicUser,
  applicationId: string,
  storageDir: string,
): Promise<ServiceResult<{ jobId: string }>> {
  if (actor.role !== "admin") {
    return fail("forbidden", "You do not have access to delete applications.");
  }
  const trimmedId = applicationId.trim();
  if (!trimmedId) return fail("validation", "Missing application.");

  return db.transaction(async (tx) => {
    const database = tx as unknown as Database;
    const [row] = await database
      .select()
      .from(applications)
      .where(eq(applications.id, trimmedId))
      .for("update")
      .limit(1);
    if (!row) return fail("not_found", "Application not found.");

    const resumeFileId = row.resumeFileId;
    await audit(database, actor.id, "application.delete", "application", row.id, {
      jobId: row.jobId,
      candidateUserId: row.candidateUserId,
      status: row.status,
    });
    await database.delete(applicationEvents).where(eq(applicationEvents.applicationId, row.id));
    await database.delete(applications).where(eq(applications.id, row.id));

    if (resumeFileId) {
      const [otherApplication] = await database
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.resumeFileId, resumeFileId))
        .limit(1);
      const [owner] = await database
        .select({ resumeFileId: users.resumeFileId })
        .from(users)
        .where(eq(users.id, row.candidateUserId))
        .limit(1);
      if (!otherApplication && owner?.resumeFileId !== resumeFileId) {
        const [file] = await database.select().from(files).where(eq(files.id, resumeFileId)).limit(1);
        if (file) {
          await database.delete(files).where(eq(files.id, file.id));
          await removeStoredFile(storageDir, file.storedName);
        }
      }
    }

    return ok({ jobId: row.jobId });
  });
}

export async function countApplicationsSince(db: Database, since: Date | null) {
  const [row] = await db
    .select({ value: count() })
    .from(applications)
    .where(since ? gte(applications.submittedAt, since) : undefined);
  return Number(row?.value ?? 0);
}

export async function statusBreakdown(db: Database, since: Date | null) {
  const rows = await db
    .select({ status: applications.status, value: count() })
    .from(applications)
    .where(since ? gte(applications.submittedAt, since) : undefined)
    .groupBy(applications.status);
  return rows.map((row) => ({ status: row.status as ApplicationStatus, count: Number(row.value) }));
}

export async function searchPeople(db: Database, query: string) {
  const filters = [eq(users.role, "candidate")];
  if (query.trim()) {
    const parts = [ilikeContains(users.name, query), ilikeContains(users.email, query)].filter(
      (part): part is NonNullable<typeof part> => Boolean(part),
    );
    if (parts.length) filters.push(or(...parts)!);
  }
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      headline: users.headline,
      location: users.location,
      applications: sql<number>`count(${applications.id})::int`,
    })
    .from(users)
    .leftJoin(applications, eq(applications.candidateUserId, users.id))
    .where(and(...filters))
    .groupBy(users.id)
    .orderBy(asc(users.name))
    .limit(100);
}
