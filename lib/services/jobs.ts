import { and, asc, count, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { ilikeContains } from "@/lib/search";
import { applications, jobCategories, jobs, savedJobs } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { asDate, asStringArray, companyTag, slugify } from "@/lib/format";
import { fail, isUniqueViolation, ok, type ServiceResult } from "@/lib/result";
import { audit } from "@/lib/services/audit";
import { newId } from "@/lib/services/ids";
import type { EmploymentType, ExperienceLevel, Job, JobStatus, PublicUser, SavedJobListing } from "@/lib/types";
import type { JobInput } from "@/lib/validation";

export type JobQuery = {
  q?: string;
  location?: string;
  category?: string;
  salaryMin?: number;
  employmentType?: string;
  experienceLevel?: string;
  remote?: boolean;
  featured?: boolean;
  sort?: "newest" | "salary" | "title";
  page?: number;
  pageSize?: number;
  status?: string;
  visibility: "public" | "admin";
};

const jobStatusTransitions: Record<JobStatus, JobStatus[]> = {
  draft: ["published", "archived"],
  published: ["draft", "closed", "archived"],
  closed: ["published", "archived"],
  archived: ["draft"],
};

export function mapJob(row: typeof jobs.$inferSelect, categoryName: string): Job {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    companyTag: row.companyTag,
    location: row.location,
    salary: row.salaryLabel,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    employmentType: row.employmentType as EmploymentType,
    experienceLevel: row.experienceLevel as ExperienceLevel,
    remote: row.remote,
    category: categoryName,
    categoryId: row.categoryId,
    featured: row.featured,
    status: row.status as JobStatus,
    postedAt: asDate(row.publishedAt ?? row.createdAt).toISOString(),
    publishedAt: row.publishedAt ? asDate(row.publishedAt).toISOString() : null,
    description: row.description,
    responsibilities: asStringArray(row.responsibilities),
    requirements: asStringArray(row.requirements),
    skills: asStringArray(row.skills),
    benefits: asStringArray(row.benefits),
  };
}

function filtersFor(query: JobQuery) {
  const filters = [];
  if (query.visibility === "public") filters.push(eq(jobs.status, "published"));
  else if (query.status && query.status !== "all") filters.push(eq(jobs.status, query.status));
  if (query.featured) filters.push(eq(jobs.featured, true));
  if (query.q?.trim()) {
    const parts = [
      ilikeContains(jobs.title, query.q),
      ilikeContains(jobs.description, query.q),
      ilikeContains(jobs.company, query.q),
      ilikeContains(jobs.location, query.q),
    ].filter((part): part is NonNullable<typeof part> => Boolean(part));
    if (parts.length) filters.push(or(...parts)!);
  }
  const locationMatch = query.location?.trim() ? ilikeContains(jobs.location, query.location) : undefined;
  if (locationMatch) filters.push(locationMatch);
  if (query.category && query.category !== "All") filters.push(eq(jobCategories.name, query.category));
  if (query.salaryMin && query.salaryMin > 0) filters.push(gte(jobs.salaryMin, query.salaryMin));
  if (query.employmentType && query.employmentType !== "All") filters.push(eq(jobs.employmentType, query.employmentType));
  if (query.experienceLevel && query.experienceLevel !== "All") filters.push(eq(jobs.experienceLevel, query.experienceLevel));
  if (query.remote) filters.push(eq(jobs.remote, true));
  return filters;
}

function orderFor(query: JobQuery) {
  if (query.sort === "salary") return [desc(jobs.salaryMin), desc(jobs.publishedAt), asc(jobs.id)];
  if (query.sort === "title") return [asc(jobs.title), asc(jobs.id)];
  return query.visibility === "admin"
    ? [desc(jobs.createdAt), asc(jobs.id)]
    : [desc(jobs.publishedAt), desc(jobs.createdAt), asc(jobs.id)];
}

export async function applicationCountsForJobs(db: Database, jobIds: string[]) {
  if (jobIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ jobId: applications.jobId, value: count() })
    .from(applications)
    .where(inArray(applications.jobId, jobIds))
    .groupBy(applications.jobId);
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.jobId, Number(row.value ?? 0));
  return map;
}

export async function searchJobs(db: Database, query: JobQuery) {
  const pageSize = Math.min(Math.max(query.pageSize ?? 6, 1), 50);
  const page = Math.min(Math.max(query.page ?? 1, 1), 10000);
  const where = and(...filtersFor(query));
  const [totalRow] = await db
    .select({ value: count() })
    .from(jobs)
    .innerJoin(jobCategories, eq(jobs.categoryId, jobCategories.id))
    .where(where);
  const total = Number(totalRow?.value ?? 0);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, maxPage);
  const rows = await db
    .select({ job: jobs, categoryName: jobCategories.name })
    .from(jobs)
    .innerJoin(jobCategories, eq(jobs.categoryId, jobCategories.id))
    .where(where)
    .orderBy(...orderFor(query))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);
  return {
    jobs: rows.map((row) => mapJob(row.job, row.categoryName)),
    total,
    page: safePage,
    pageSize,
  };
}

async function findJobRow(db: Database, idOrSlug: string) {
  const selection = { job: jobs, categoryName: jobCategories.name };
  const base = () => db.select(selection).from(jobs).innerJoin(jobCategories, eq(jobs.categoryId, jobCategories.id));
  const [byId] = await base().where(eq(jobs.id, idOrSlug)).limit(1);
  if (byId) return byId;
  const [bySlug] = await base().where(eq(jobs.slug, idOrSlug)).limit(1);
  return bySlug ?? null;
}

export async function getPublicJob(db: Database, idOrSlug: string) {
  const row = await findJobRow(db, idOrSlug);
  if (!row) return null;
  if (row.job.status !== "published" && row.job.status !== "closed") return null;
  return mapJob(row.job, row.categoryName);
}

export async function getAnyJob(db: Database, idOrSlug: string) {
  const row = await findJobRow(db, idOrSlug);
  if (!row) return null;
  const [apps] = await db.select({ value: count() }).from(applications).where(eq(applications.jobId, row.job.id));
  return { job: mapJob(row.job, row.categoryName), applicationCount: Number(apps?.value ?? 0) };
}

export async function relatedJobs(db: Database, job: Job) {
  const result = await searchJobs(db, {
    visibility: "public",
    category: job.category,
    pageSize: 4,
    sort: "newest",
  });
  return result.jobs.filter((item) => item.id !== job.id).slice(0, 3);
}

async function uniqueSlug(db: Database, title: string) {
  const base = slugify(title);
  for (let index = 1; index < 40; index += 1) {
    const slug = index === 1 ? base : `${base}-${index}`;
    const [existing] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.slug, slug)).limit(1);
    if (!existing) return slug;
  }
  return `${base}-${newId().slice(0, 8)}`;
}

function valuesFromInput(input: JobInput, status: JobStatus, publishedAt: Date | null) {
  return {
    title: input.title,
    company: input.company,
    companyTag: companyTag(input.company),
    location: input.location,
    salaryLabel: input.salaryLabel,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    employmentType: input.employmentType,
    experienceLevel: input.experienceLevel,
    remote: input.remote,
    categoryId: input.categoryId,
    featured: input.featured,
    status,
    description: input.description,
    responsibilities: input.responsibilities,
    requirements: input.requirements,
    skills: input.skills,
    benefits: input.benefits,
    publishedAt,
    updatedAt: new Date(),
  };
}

async function categoryExists(db: Database, categoryId: string) {
  const [row] = await db.select({ id: jobCategories.id }).from(jobCategories).where(eq(jobCategories.id, categoryId)).limit(1);
  return Boolean(row);
}

export async function createJob(db: Database, actor: PublicUser, input: JobInput): Promise<ServiceResult<Job>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to create jobs.");
  if (!(await categoryExists(db, input.categoryId))) return fail("validation", "Choose a valid category.");
  const status: JobStatus = input.publish ? "published" : "draft";
  const id = newId();
  await db.insert(jobs).values({
    id,
    slug: await uniqueSlug(db, input.title),
    ...valuesFromInput(input, status, input.publish ? new Date() : null),
    seeded: false,
    createdBy: actor.id,
  });
  await audit(db, actor.id, input.publish ? "job.publish" : "job.create", "job", id, { title: input.title });
  const created = await getAnyJob(db, id);
  return ok(created!.job);
}

export async function updateJob(db: Database, actor: PublicUser, jobId: string, input: JobInput): Promise<ServiceResult<Job>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to edit jobs.");
  const current = await getAnyJob(db, jobId);
  if (!current) return fail("not_found", "Job not found.");
  if (!(await categoryExists(db, input.categoryId))) return fail("validation", "Choose a valid category.");
  let status = current.job.status;
  let publishedAt = current.job.publishedAt ? new Date(current.job.publishedAt) : null;
  if (input.publish && status !== "published") {
    if (!jobStatusTransitions[status].includes("published")) {
      return fail("invalid_transition", "This job cannot be published from its current state.");
    }
    status = "published";
    publishedAt = publishedAt ?? new Date();
  } else if (!input.publish && status === "published") {
    status = "draft";
  }
  await db
    .update(jobs)
    .set({
      ...valuesFromInput(input, status, publishedAt),
      closedAt: status === "closed" ? new Date() : null,
    })
    .where(eq(jobs.id, current.job.id));
  await audit(db, actor.id, "job.update", "job", current.job.id, { title: input.title, status });
  const updated = await getAnyJob(db, current.job.id);
  return ok(updated!.job);
}

export async function setJobStatus(db: Database, actor: PublicUser, jobId: string, next: JobStatus): Promise<ServiceResult<Job>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to change job status.");
  const current = await getAnyJob(db, jobId);
  if (!current) return fail("not_found", "Job not found.");
  if (current.job.status === next) return ok(current.job);
  if (!jobStatusTransitions[current.job.status].includes(next)) {
    return fail("invalid_transition", `Cannot move a job from ${current.job.status} to ${next}.`);
  }
  const now = new Date();
  await db
    .update(jobs)
    .set({
      status: next,
      updatedAt: now,
      publishedAt: next === "published" ? new Date(current.job.publishedAt ?? now.toISOString()) : undefined,
      closedAt: next === "closed" ? now : next === "published" ? null : undefined,
    })
    .where(eq(jobs.id, current.job.id));
  await audit(db, actor.id, `job.${next}`, "job", current.job.id, { from: current.job.status, to: next });
  const updated = await getAnyJob(db, current.job.id);
  return ok(updated!.job);
}

export async function deleteJob(db: Database, actor: PublicUser, jobId: string): Promise<ServiceResult<{ id: string }>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to delete jobs.");
  const current = await getAnyJob(db, jobId);
  if (!current) return fail("not_found", "Job not found.");
  if (current.applicationCount > 0) {
    return fail("conflict", "This job has applications. Archive it instead of deleting it.");
  }
  await db.delete(jobs).where(eq(jobs.id, current.job.id));
  await audit(db, actor.id, "job.delete", "job", current.job.id, { title: current.job.title });
  return ok({ id: current.job.id });
}

export async function isJobSaved(db: Database, userId: string, jobId: string) {
  const [row] = await db
    .select({ jobId: savedJobs.jobId })
    .from(savedJobs)
    .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
    .limit(1);
  return Boolean(row);
}

export async function toggleSavedJob(db: Database, user: PublicUser, jobId: string): Promise<ServiceResult<{ saved: boolean }>> {
  const job = await getPublicJob(db, jobId);
  if (!job || job.status !== "published") return fail("not_found", "That job is not available to save.");
  const saved = await isJobSaved(db, user.id, job.id);
  if (saved) {
    await db.delete(savedJobs).where(and(eq(savedJobs.userId, user.id), eq(savedJobs.jobId, job.id)));
    return ok({ saved: false });
  }
  try {
    await db.insert(savedJobs).values({ userId: user.id, jobId: job.id });
  } catch (error) {
    if (isUniqueViolation(error)) return ok({ saved: true });
    throw error;
  }
  return ok({ saved: true });
}

export async function savedJobIdsForUser(db: Database, userId: string) {
  const rows = await db.select({ jobId: savedJobs.jobId }).from(savedJobs).where(eq(savedJobs.userId, userId));
  return new Set(rows.map((row) => row.jobId));
}

function listingStateFor(status: JobStatus): SavedJobListing["listingState"] {
  if (status === "published") return "open";
  if (status === "closed") return "closed";
  return "unavailable";
}

export async function listSavedJobs(db: Database, userId: string): Promise<SavedJobListing[]> {
  const rows = await db
    .select({ job: jobs, categoryName: jobCategories.name })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .innerJoin(jobCategories, eq(jobs.categoryId, jobCategories.id))
    .where(eq(savedJobs.userId, userId))
    .orderBy(desc(savedJobs.createdAt));
  return rows.map((row) => {
    const job = mapJob(row.job, row.categoryName);
    return { ...job, listingState: listingStateFor(job.status) };
  });
}

export async function medianReviewHours(db: Database) {
  const rows = await db.execute<{ application_id: string; submitted_at: Date | string; reviewed_at: Date | string }>(sql`
    SELECT a.id AS application_id,
           a.submitted_at,
           MIN(e.created_at) AS reviewed_at
    FROM application_events e
    INNER JOIN applications a ON a.id = e.application_id
    WHERE e.to_status IN ('Under Review', 'Accepted', 'Rejected')
    GROUP BY a.id, a.submitted_at
  `);
  const list = Array.isArray(rows) ? rows : rows.rows;
  const hours = list
    .map((row) => (asDate(row.reviewed_at).getTime() - asDate(row.submitted_at).getTime()) / 36e5)
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  if (hours.length === 0) return null;
  const mid = Math.floor(hours.length / 2);
  return hours.length % 2 === 1 ? hours[mid]! : (hours[mid - 1]! + hours[mid]!) / 2;
}
