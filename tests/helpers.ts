import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../lib/db/schema";
import { migrateAll } from "../lib/db/migrate";
import type { Database } from "../lib/db/types";
import { hashPassword } from "../lib/auth/password";
import { users, jobCategories } from "../lib/db/schema";
import { newId } from "../lib/services/ids";
import type { PublicUser } from "../lib/types";
import { toPublicUser } from "../lib/services/accounts";

export const TEST_SECRET = "test-session-secret-that-is-long-enough";

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrateAll((statement) => client.exec(statement));
  return { db: db as Database, close: () => client.close() };
}

export async function createUser(
  db: Database,
  input: { email: string; name: string; role?: "candidate" | "admin"; password?: string },
): Promise<PublicUser> {
  const [row] = await db
    .insert(users)
    .values({
      id: newId(),
      email: input.email,
      name: input.name,
      role: input.role ?? "candidate",
      passwordHash: await hashPassword(input.password ?? "password123"),
      phone: "",
      headline: "",
      location: "",
      bio: "",
    })
    .returning();
  return toPublicUser(row!);
}

export async function createCategory(db: Database, name = "Engineering") {
  const [row] = await db
    .insert(jobCategories)
    .values({ id: newId(), name, slug: name.toLowerCase(), color: "bg-electric" })
    .returning();
  return row!;
}

export const sampleJob = {
  title: "Platform Engineer",
  company: "Northgrid",
  location: "Cairo",
  salaryLabel: "$80k – $100k",
  salaryMin: 80000,
  salaryMax: 100000,
  employmentType: "Full-time" as const,
  experienceLevel: "Senior" as const,
  remote: true,
  featured: true,
  description: "Build the hiring marketplace surfaces and the review tools behind them.",
  responsibilities: ["Ship listings"],
  requirements: ["TypeScript"],
  skills: ["Next.js"],
  benefits: ["Remote"],
  publish: true,
};
