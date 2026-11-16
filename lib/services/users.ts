import { and, asc, count, desc, eq, inArray, or } from "drizzle-orm";
import { ilikeContains } from "@/lib/search";
import { applications, files, users } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { listCandidateApplications, type ApplicationView } from "@/lib/services/applications";
import { audit } from "@/lib/services/audit";
import { destroyUserSessions } from "@/lib/services/accounts";
import { removeStoredFile } from "@/lib/services/files";
import type { PublicUser } from "@/lib/types";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "candidate";
  createdAt: string;
  applicationCount: number;
  deactivated: boolean;
};

export type AdminUserQuery = {
  q?: string;
  role?: "all" | "admin" | "candidate";
  sort?: "newest" | "name" | "email";
  page?: number;
  pageSize?: number;
};

export type AdminUserDetails = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "candidate";
  createdAt: string;
  deactivated: boolean;
  applicationCount: number;
  applications: ApplicationView[];
};

export async function listUsersForAdmin(
  db: Database,
  actor: PublicUser,
  query: AdminUserQuery,
): Promise<ServiceResult<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }>> {
  if (actor.role !== "admin") {
    return fail("forbidden", "You do not have access to the user directory.");
  }

  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 50);
  const page = Math.min(Math.max(query.page ?? 1, 1), 10_000);
  const filters = [];
  const role = query.role ?? "all";
  if (role !== "all") filters.push(eq(users.role, role));
  if (query.q?.trim()) {
    const parts = [ilikeContains(users.name, query.q), ilikeContains(users.email, query.q)].filter(
      (part): part is NonNullable<typeof part> => Boolean(part),
    );
    if (parts.length) filters.push(or(...parts)!);
  }
  const where = filters.length ? and(...filters) : undefined;

  const order =
    query.sort === "name"
      ? asc(users.name)
      : query.sort === "email"
        ? asc(users.email)
        : desc(users.createdAt);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      deactivatedAt: users.deactivatedAt,
    })
    .from(users)
    .where(where)
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [totalRow] = await db.select({ value: count() }).from(users).where(where);
  const userIds = rows.map((row) => row.id);
  const countMap = new Map<string, number>();
  if (userIds.length > 0) {
    const countRows = await db
      .select({ userId: applications.candidateUserId, value: count() })
      .from(applications)
      .where(inArray(applications.candidateUserId, userIds))
      .groupBy(applications.candidateUserId);
    for (const row of countRows) countMap.set(row.userId, Number(row.value ?? 0));
  }

  return ok({
    users: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as "admin" | "candidate",
      createdAt: row.createdAt.toISOString(),
      applicationCount: countMap.get(row.id) ?? 0,
      deactivated: Boolean(row.deactivatedAt),
    })),
    total: Number(totalRow?.value ?? 0),
    page,
    pageSize,
  });
}

export async function getUserDetailsForAdmin(
  db: Database,
  actor: PublicUser,
  userId: string,
): Promise<ServiceResult<AdminUserDetails>> {
  if (actor.role !== "admin") {
    return fail("forbidden", "You do not have access to the user directory.");
  }
  const trimmedId = userId.trim();
  if (!trimmedId) return fail("validation", "Missing user.");
  const [target] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      deactivatedAt: users.deactivatedAt,
    })
    .from(users)
    .where(eq(users.id, trimmedId))
    .limit(1);
  if (!target) return fail("not_found", "User not found.");
  const applications = await listCandidateApplications(db, target.id);
  return ok({
    id: target.id,
    name: target.name,
    email: target.email,
    role: target.role as "admin" | "candidate",
    createdAt: target.createdAt.toISOString(),
    deactivated: Boolean(target.deactivatedAt),
    applicationCount: applications.length,
    applications,
  });
}

async function applicationCountForUser(db: Database, userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(applications)
    .where(eq(applications.candidateUserId, userId));
  return Number(row?.value ?? 0);
}

async function purgeUserFiles(db: Database, userId: string, storageDir: string) {
  const owned = await db.select().from(files).where(eq(files.ownerUserId, userId));
  for (const file of owned) {
    await removeStoredFile(storageDir, file.storedName);
    await db.delete(files).where(eq(files.id, file.id));
  }
}

function adminGuard(actor: PublicUser, targetId: string, targetRole: string): ServiceResult<never> | null {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to manage users.");
  if (actor.id === targetId) return fail("forbidden", "You cannot remove your own admin account.");
  if (targetRole === "admin") return fail("forbidden", "Admin accounts cannot be deleted or deactivated here.");
  return null;
}

export async function deactivateUserForAdmin(
  db: Database,
  actor: PublicUser,
  targetUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  const trimmedId = targetUserId.trim();
  if (!trimmedId) return fail("validation", "Missing user.");
  const [target] = await db.select().from(users).where(eq(users.id, trimmedId)).limit(1);
  if (!target) return fail("not_found", "User not found.");
  const blocked = adminGuard(actor, target.id, target.role);
  if (blocked) return blocked;
  if (target.deactivatedAt) return ok({ id: target.id });
  await db.update(users).set({ deactivatedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, target.id));
  await destroyUserSessions(db, target.id);
  await audit(db, actor.id, "user.deactivate", "user", target.id, { email: target.email });
  return ok({ id: target.id });
}

export async function deleteUserForAdmin(
  db: Database,
  actor: PublicUser,
  targetUserId: string,
  storageDir: string,
): Promise<ServiceResult<{ id: string }>> {
  const trimmedId = targetUserId.trim();
  if (!trimmedId) return fail("validation", "Missing user.");
  const [target] = await db.select().from(users).where(eq(users.id, trimmedId)).limit(1);
  if (!target) return fail("not_found", "User not found.");
  const blocked = adminGuard(actor, target.id, target.role);
  if (blocked) return blocked;
  const applications = await applicationCountForUser(db, target.id);
  if (applications > 0) {
    return fail(
      "conflict",
      `This account has ${applications} application(s) on record. Deactivate the account instead to block sign-in while keeping hiring history.`,
    );
  }
  return db.transaction(async (tx) => {
    const database = tx as unknown as Database;
    await database
      .update(users)
      .set({ resumeFileId: null, avatarFileId: null, updatedAt: new Date() })
      .where(eq(users.id, target.id));
    await purgeUserFiles(database, target.id, storageDir);
    await destroyUserSessions(database, target.id);
    await database.delete(users).where(eq(users.id, target.id));
    const [remaining] = await database.select({ id: users.id }).from(users).where(eq(users.id, target.id)).limit(1);
    if (remaining) {
      return fail("conflict", "The account could not be removed because related database records still reference it.");
    }
    await audit(database, actor.id, "user.delete", "user", target.id, { email: target.email });
    return ok({ id: target.id });
  });
}
