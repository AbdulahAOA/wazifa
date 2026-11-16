import { asc, count, eq, sql } from "drizzle-orm";
import { jobCategories, jobs, settings } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { fail, isUniqueViolation, ok, type ServiceResult } from "@/lib/result";
import { newId } from "@/lib/services/ids";
import { audit } from "@/lib/services/audit";
import { slugify } from "@/lib/format";
import type { PublicUser } from "@/lib/types";

const palette = ["bg-electric", "bg-cobalt text-white", "bg-coral text-white", "bg-ink text-white", "bg-pale"];

export type BoardSettings = {
  boardName: string;
  publicDomain: string;
  adminDomain: string;
  showFeatured: boolean;
};

export async function getSettings(db: Database): Promise<BoardSettings> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    boardName: map.get("board_name") || "Wazifa",
    publicDomain: map.get("public_domain") || "wazifa.app",
    adminDomain: map.get("admin_domain") || "admin.wazifa.app",
    showFeatured: map.get("show_featured") !== "false",
  };
}

export async function saveSettings(
  db: Database,
  actor: PublicUser,
  input: BoardSettings,
): Promise<ServiceResult<BoardSettings>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to settings.");
  const boardName = input.boardName.trim();
  const publicDomain = input.publicDomain.trim();
  const adminDomain = input.adminDomain.trim();
  if (boardName.length < 2 || boardName.length > 60) return fail("validation", "Board name is required.");
  if (!/^[a-z0-9.-]+$/i.test(publicDomain) || !/^[a-z0-9.-]+$/i.test(adminDomain)) {
    return fail("validation", "Enter domain names without a protocol.");
  }
  const entries = [
    ["board_name", boardName],
    ["public_domain", publicDomain],
    ["admin_domain", adminDomain],
    ["show_featured", input.showFeatured ? "true" : "false"],
  ] as const;
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
  await audit(db, actor.id, "settings.update", "settings", "board", { boardName });
  return ok({ boardName, publicDomain, adminDomain, showFeatured: input.showFeatured });
}

export async function listCategories(db: Database) {
  const rows = await db
    .select({
      id: jobCategories.id,
      name: jobCategories.name,
      slug: jobCategories.slug,
      color: jobCategories.color,
      count: sql<number>`count(${jobs.id}) filter (where ${jobs.status} = 'published')::int`,
    })
    .from(jobCategories)
    .leftJoin(jobs, eq(jobs.categoryId, jobCategories.id))
    .groupBy(jobCategories.id)
    .orderBy(asc(jobCategories.name));
  return rows.map((row) => ({ ...row, count: Number(row.count ?? 0) }));
}

export async function createCategory(db: Database, actor: PublicUser, name: string): Promise<ServiceResult<{ id: string }>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to categories.");
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 40) return fail("validation", "Category name must be 2–40 characters.");
  const existing = await db.select({ id: jobCategories.id }).from(jobCategories);
  try {
    const [row] = await db
      .insert(jobCategories)
      .values({
        id: newId(),
        name: trimmed,
        slug: slugify(trimmed),
        color: palette[existing.length % palette.length]!,
      })
      .returning();
    await audit(db, actor.id, "category.create", "category", row!.id, { name: trimmed });
    return ok({ id: row!.id });
  } catch (error) {
    if (isUniqueViolation(error)) return fail("duplicate", "That category already exists.");
    throw error;
  }
}

export async function deleteCategory(db: Database, actor: PublicUser, categoryId: string): Promise<ServiceResult<{ id: string }>> {
  if (actor.role !== "admin") return fail("forbidden", "You do not have access to categories.");
  const [used] = await db.select({ value: count() }).from(jobs).where(eq(jobs.categoryId, categoryId));
  if (Number(used?.value ?? 0) > 0) {
    return fail("conflict", "Move or delete the jobs in this category before removing it.");
  }
  const [row] = await db.delete(jobCategories).where(eq(jobCategories.id, categoryId)).returning();
  if (!row) return fail("not_found", "Category not found.");
  await audit(db, actor.id, "category.delete", "category", categoryId, { name: row.name });
  return ok({ id: categoryId });
}
