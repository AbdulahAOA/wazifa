import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import { jobCategories, jobs } from "../lib/db/schema";
import { newId } from "../lib/services/ids";

async function main() {
  const db = await getDb();
  const existing = await db.select({ id: jobs.id }).from(jobs);
  const [category] = await db.select({ id: jobCategories.id }).from(jobCategories).limit(1);
  if (!category) throw new Error("No categories found. Run npm run db:seed first.");
  const id = newId();
  const slug = `verify-persistence-${id.slice(0, 8)}`;
  await db.insert(jobs).values({
    id,
    slug,
    title: "Persistence Probe",
    company: "Wazifa",
    companyTag: "WA",
    location: "Cairo",
    salaryLabel: "$1",
    salaryMin: 1,
    salaryMax: 1,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: false,
    categoryId: category.id,
    featured: false,
    status: "draft",
    description: "Temporary row used only by scripts/verify-persistence.ts",
    responsibilities: [],
    requirements: [],
    skills: [],
    benefits: [],
    seeded: false,
  });
  const [created] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!created) throw new Error("Insert did not persist.");
  await db.update(jobs).set({ title: "Persistence Probe Updated" }).where(eq(jobs.id, id));
  const [updated] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (updated?.title !== "Persistence Probe Updated") throw new Error("Update did not persist.");
  await db.delete(jobs).where(eq(jobs.id, id));
  const [removed] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (removed) throw new Error("Delete did not persist.");
  console.log(`Persistence probe passed. Existing jobs counted: ${existing.length}.`);
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
