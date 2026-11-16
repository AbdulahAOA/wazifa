import { and, eq } from "drizzle-orm";
import { applications as seedApplications, categories as seedCategories, jobs as seedJobs } from "../lib/data";
import { closeDb, getDb } from "../lib/db/client";
import { loadEnv } from "../lib/env";
import { hashPassword } from "../lib/auth/password";
import { applicationEvents, applications, jobCategories, jobs, users } from "../lib/db/schema";
import { storeResume } from "../lib/services/files";
import { newId } from "../lib/services/ids";
import { slugify } from "../lib/format";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    console.error("Refusing to seed while NODE_ENV=production. Set SEED_ALLOW_PRODUCTION=true to override.");
    process.exit(1);
  }
  const env = loadEnv();
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@wazifa.local").trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "";
  const candidatePassword = process.env.SEED_CANDIDATE_PASSWORD || "";
  if (adminPassword.length < 12) {
    console.error("Set SEED_ADMIN_PASSWORD to at least 12 characters in .env before seeding.");
    process.exit(1);
  }
  if (candidatePassword.length < 8) {
    console.error("Set SEED_CANDIDATE_PASSWORD to at least 8 characters in .env before seeding.");
    process.exit(1);
  }

  const db = await getDb();
  const adminHash = await hashPassword(adminPassword);
  const candidateHash = await hashPassword(candidatePassword);
  let [admin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        id: newId(),
        email: adminEmail,
        passwordHash: adminHash,
        name: "Wazifa Operator",
        role: "admin",
        phone: "",
        headline: "Operator",
        location: "Cairo",
        bio: "",
      })
      .returning();
    console.log(`Created admin ${adminEmail}`);
  } else if (admin.role !== "admin") {
    console.error(`Refusing to seed: ${adminEmail} already exists and is not an admin.`);
    process.exit(1);
  } else {
    console.log(`Admin ${adminEmail} already exists. Password was left unchanged.`);
  }

  const categoryIds = new Map<string, string>();
  for (const category of seedCategories) {
    const slug = slugify(category.name);
    let [row] = await db.select().from(jobCategories).where(eq(jobCategories.slug, slug)).limit(1);
    if (!row) {
      [row] = await db
        .insert(jobCategories)
        .values({ id: newId(), name: category.name, slug, color: category.color })
        .returning();
    }
    categoryIds.set(category.name, row!.id);
  }

  const jobIds = new Map<string, string>();
  for (const job of seedJobs) {
    const slug = slugify(job.title);
    let [row] = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1);
    const publishedAt = new Date(`${job.postedAt}T12:00:00.000Z`);
    if (!row) {
      [row] = await db
        .insert(jobs)
        .values({
          id: newId(),
          slug,
          title: job.title,
          company: job.company,
          companyTag: job.companyTag,
          location: job.location,
          salaryLabel: job.salary,
          salaryMin: job.salaryMin,
          salaryMax: null,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          remote: job.remote,
          categoryId: categoryIds.get(job.category)!,
          featured: job.featured,
          status: "published",
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          skills: job.skills,
          benefits: job.benefits,
          seeded: true,
          createdBy: admin!.id,
          publishedAt,
          createdAt: publishedAt,
          updatedAt: publishedAt,
        })
        .returning();
    }
    jobIds.set(job.id, row!.id);
  }

  for (const application of seedApplications) {
    const email = application.email.toLowerCase();
    let [candidate] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!candidate) {
      [candidate] = await db
        .insert(users)
        .values({
          id: newId(),
          email,
          passwordHash: candidateHash,
          name: application.candidateName,
          role: "candidate",
          phone: application.phone,
          headline: "",
          location: "",
          bio: "",
        })
        .returning();
    }
    const jobId = jobIds.get(application.jobId);
    if (!jobId || !candidate) continue;
    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.jobId, jobId), eq(applications.candidateUserId, candidate.id)))
      .limit(1);
    if (existing) continue;

    let resumeFileId = candidate!.resumeFileId;
    if (!resumeFileId) {
      const stored = await storeResume(db, {
        ownerUserId: candidate!.id,
        filename: "resume.pdf",
        bytes: Buffer.from(`%PDF-1.4\n% Seed resume for ${application.candidateName}\n%%EOF\n`),
        storageDir: env.uploadDir,
      });
      if (stored.ok) {
        resumeFileId = stored.data.id;
        await db.update(users).set({ resumeFileId }).where(eq(users.id, candidate!.id));
      }
    }

    const submittedAt = new Date(`${application.submittedAt}T12:00:00.000Z`);
    const id = newId();
    await db.insert(applications).values({
      id,
      jobId,
      candidateUserId: candidate!.id,
      candidateName: application.candidateName,
      email,
      phone: application.phone,
      coverLetter: application.coverLetter,
      details: "",
      resumeFileId,
      status: application.status,
      notes: "",
      seeded: true,
      submittedAt,
      updatedAt: submittedAt,
    });
    await db.insert(applicationEvents).values({
      id: newId(),
      applicationId: id,
      actorUserId: candidate!.id,
      fromStatus: null,
      toStatus: "Pending",
      note: "Seeded application",
      createdAt: submittedAt,
    });
    if (application.status !== "Pending") {
      const reviewedAt = new Date(submittedAt.getTime() + 36 * 60 * 60 * 1000);
      await db.insert(applicationEvents).values({
        id: newId(),
        applicationId: id,
        actorUserId: admin!.id,
        fromStatus: "Pending",
        toStatus: application.status,
        note: "Seeded review",
        createdAt: reviewedAt,
      });
    }
  }

  console.log("Seed complete.");
  console.log("Uploaded files are stored in the configured UPLOAD_DIR.");
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
