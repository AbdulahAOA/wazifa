import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import { jobCategories, jobs, users } from "../lib/db/schema";
import { toPublicUser } from "../lib/services/accounts";
import { createJob, deleteJob, setJobStatus, updateJob } from "../lib/services/jobs";
import { changeApplicationStatus, listAdminApplications } from "../lib/services/applications";

async function main() {
  const db = await getDb();
  const [adminRow] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const [category] = await db.select().from(jobCategories).where(eq(jobCategories.name, "Engineering")).limit(1);
  if (!adminRow || !category) throw new Error("Missing admin or Engineering category.");
  const admin = toPublicUser(adminRow);

  const created = await createJob(db, admin, {
    title: "Verification Engineer (script)",
    company: "Wazifa QA",
    location: "Cairo",
    salaryLabel: "$60k – $80k",
    salaryMin: 60000,
    salaryMax: 80000,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: true,
    categoryId: category.id,
    featured: false,
    description: "This role exists only to verify operator job workflows in the local Wazifa desk.",
    responsibilities: ["Ship verification jobs"],
    requirements: ["Careful clicking"],
    skills: ["QA"],
    benefits: ["None"],
    publish: false,
  });
  if (!created.ok) throw new Error(created.error);

  const published = await setJobStatus(db, admin, created.data.id, "published");
  const edited = await updateJob(db, admin, created.data.id, {
    title: "Verification Engineer (script)",
    company: "Wazifa QA",
    location: "Alexandria",
    salaryLabel: "$60k – $80k",
    salaryMin: 60000,
    salaryMax: 80000,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: true,
    categoryId: category.id,
    featured: false,
    description: "Edited location during operator verification.",
    responsibilities: ["Ship verification jobs"],
    requirements: ["Careful clicking"],
    skills: ["QA"],
    benefits: ["None"],
    publish: true,
  });
  const closed = await setJobStatus(db, admin, created.data.id, "closed");

  const disposable = await createJob(db, admin, {
    title: "Disposable Draft (script)",
    company: "Wazifa QA",
    location: "Cairo",
    salaryLabel: "$1",
    salaryMin: 1,
    salaryMax: 1,
    employmentType: "Contract",
    experienceLevel: "Junior",
    remote: false,
    categoryId: category.id,
    featured: false,
    description: "Draft used only to verify delete of a job with no applications.",
    responsibilities: [],
    requirements: [],
    skills: [],
    benefits: [],
    publish: false,
  });
  if (!disposable.ok) throw new Error(disposable.error);
  const removed = await deleteJob(db, admin, disposable.data.id);

  const seededWithApps = await db
    .select({ id: jobs.id, title: jobs.title })
    .from(jobs)
    .where(and(eq(jobs.slug, "senior-frontend-engineer")));
  const blockedDelete = seededWithApps[0]
    ? await deleteJob(db, admin, seededWithApps[0].id)
    : { ok: false, code: "missing" };

  const queue = await listAdminApplications(db, admin, { q: "Verify Candidate", pageSize: 5 });
  const sampleApp = queue.applications[0];
  const reviewed = sampleApp
    ? await changeApplicationStatus(db, admin, sampleApp.id, "Under Review", "Script review", sampleApp.status)
    : null;

  console.log(
    JSON.stringify({
      created: created.ok ? { id: created.data.id, status: created.data.status } : created,
      published: published.ok ? published.data.status : published,
      edited: edited.ok ? edited.data.location : edited,
      closed: closed.ok ? closed.data.status : closed,
      deletedDraft: removed.ok,
      deleteJobWithApps: blockedDelete.ok ? "deleted" : "code" in blockedDelete ? blockedDelete.code : "blocked",
      reviewed: reviewed ? (reviewed.ok ? reviewed.data.status : reviewed.error) : "missing",
      applicationId: sampleApp?.id ?? null,
    }),
  );
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
