import { closeDb, getDb } from "../lib/db/client";
import { createJob } from "../lib/services/jobs";
import { getApplicationForActor, listCandidateApplications } from "../lib/services/applications";
import { users } from "../lib/db/schema";
import { eq, or } from "drizzle-orm";
import { toPublicUser } from "../lib/services/accounts";
import { jobCategories } from "../lib/db/schema";

async function main() {
  const unauthFile = await fetch("http://127.0.0.1:3000/api/files/not-a-real-file", { redirect: "manual" });
  const unauthDash = await fetch("http://127.0.0.1:3000/dashboard", { redirect: "manual" });
  const unauthApps = await fetch("http://127.0.0.1:3000/applications", { redirect: "manual" });

  const db = await getDb();
  const [candidate] = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, "verify.candidate.1025@wazifa.test"),
        eq(users.email, "e2e.candidate.1025@wazifa.test"),
      ),
    )
    .limit(1);
  if (!candidate) throw new Error("Verification candidate is missing.");
  const actor = toPublicUser(candidate);
  const [category] = await db.select({ id: jobCategories.id }).from(jobCategories).limit(1);
  const created = await createJob(db, actor, {
    title: "Unauthorized Candidate Job",
    company: "Nope",
    location: "Cairo",
    salaryLabel: "$1",
    salaryMin: 1,
    salaryMax: 1,
    employmentType: "Full-time",
    experienceLevel: "Mid",
    remote: false,
    categoryId: category?.id ?? "missing",
    featured: false,
    description: "A candidate must not be able to create this job.",
    responsibilities: [],
    requirements: [],
    skills: [],
    benefits: [],
    publish: true,
  });
  const own = await listCandidateApplications(db, actor.id);
  const { applications } = await import("../lib/db/schema");
  const [someoneElse] = await db.select({ id: applications.id }).from(applications).limit(1);
  const crossed =
    someoneElse && !own.some((item) => item.id === someoneElse.id)
      ? await getApplicationForActor(db, actor, someoneElse.id)
      : null;

  console.log(
    JSON.stringify({
      fileStatus: unauthFile.status,
      dashboardStatus: unauthDash.status,
      dashboardLocation: unauthDash.headers.get("location"),
      applicationsStatus: unauthApps.status,
      applicationsLocation: unauthApps.headers.get("location"),
      candidateCreateJob: created.ok ? "allowed" : created.code,
      otherApplicationVisible: crossed !== null,
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
