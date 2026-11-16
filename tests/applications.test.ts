import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import {
  changeApplicationStatus,
  deleteApplication,
  getApplicationForActor,
  listCandidateApplications,
  submitApplication,
} from "../lib/services/applications";
import { createJob } from "../lib/services/jobs";
import { getDashboard } from "../lib/services/dashboard";
import { detectResume } from "../lib/services/files";
import { canTransition } from "../lib/services/transitions";
import { createCategory, createTestDb, createUser, sampleJob } from "./helpers";
import type { Database } from "../lib/db/types";
import type { PublicUser } from "../lib/types";

let db: Database;
let close: () => Promise<void>;
let admin: PublicUser;
let candidate: PublicUser;
let other: PublicUser;
let storageDir: string;
let jobId: string;

const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "wazifa-"));
  admin = await createUser(db, { email: "reviewer@wazifa.test", name: "Reviewer", role: "admin" });
  candidate = await createUser(db, { email: "candidate@wazifa.test", name: "Candidate One" });
  other = await createUser(db, { email: "other@wazifa.test", name: "Candidate Two" });
  const category = await createCategory(db, "Product");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Product Engineer" });
  if (!job.ok) throw new Error(job.error);
  jobId = job.data.id;
});

after(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
  await close();
});

function resume(name = "resume.pdf") {
  return { filename: name, bytes: pdf, storageDir };
}

test("resume bytes must match the extension", () => {
  assert.equal(detectResume(pdf, "resume.pdf"), "pdf");
  assert.equal(detectResume(Buffer.from("not a pdf"), "resume.pdf"), null);
  assert.equal(detectResume(pdf, "resume.exe"), null);
});

test("a candidate can apply once, and a second active application is rejected", async () => {
  const first = await submitApplication(
    db,
    candidate,
    { jobId, phone: "+20 100 000 0000", coverLetter: "I have shipped hiring tools and want to own this queue.", details: "" },
    resume(),
  );
  assert.equal(first.ok, true);
  const second = await submitApplication(
    db,
    candidate,
    { jobId, phone: "", coverLetter: "I have shipped hiring tools and want to own this queue again.", details: "" },
    resume("again.pdf"),
  );
  assert.equal(second.ok, false);
  if (second.ok) return;
  assert.equal(second.code, "duplicate");
});

test("candidates only see their own applications", async () => {
  const own = await listCandidateApplications(db, candidate.id);
  assert.equal(own.length, 1);
  const hidden = await getApplicationForActor(db, other, own[0]!.id);
  assert.equal(hidden, null);
  const visible = await getApplicationForActor(db, candidate, own[0]!.id);
  assert.equal(visible?.candidateName, "Candidate One");
});

test("admins can delete an application; candidates cannot", async () => {
  const category = await createCategory(db, "Support");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Support Agent" });
  if (!job.ok) throw new Error(job.error);
  const applied = await submitApplication(
    db,
    other,
    {
      jobId: job.data.id,
      phone: "",
      coverLetter: "I would keep candidate queues clear and respond with empathy and speed.",
      details: "",
    },
    resume("support.pdf"),
  );
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  const forbidden = await deleteApplication(db, candidate, applied.data.id, storageDir);
  assert.equal(forbidden.ok, false);
  if (forbidden.ok) return;
  assert.equal(forbidden.code, "forbidden");
  const removed = await deleteApplication(db, admin, applied.data.id, storageDir);
  assert.equal(removed.ok, true);
  assert.equal(await getApplicationForActor(db, admin, applied.data.id), null);
  const again = await deleteApplication(db, admin, applied.data.id, storageDir);
  assert.equal(again.ok, false);
  if (again.ok) return;
  assert.equal(again.code, "not_found");
});

test("status transitions are enforced and recorded", async () => {
  assert.equal(canTransition("candidate", "Pending", "Accepted"), false);
  assert.equal(canTransition("admin", "Accepted", "Pending"), false);
  const [application] = await listCandidateApplications(db, candidate.id);
  const illegal = await changeApplicationStatus(db, candidate, application!.id, "Accepted", "", "Pending");
  assert.equal(illegal.ok, false);
  const review = await changeApplicationStatus(db, admin, application!.id, "Under Review", "Strong portfolio", "Pending");
  assert.equal(review.ok, true);
  const conflict = await changeApplicationStatus(db, admin, application!.id, "Accepted", "Late click", "Pending");
  assert.equal(conflict.ok, false);
  if (conflict.ok) return;
  assert.equal(conflict.code, "conflict");
  const accepted = await changeApplicationStatus(db, admin, application!.id, "Accepted", "Offer", "Under Review");
  assert.equal(accepted.ok, true);
  const withdraw = await changeApplicationStatus(db, candidate, application!.id, "Withdrawn", "", "Accepted");
  assert.equal(withdraw.ok, false);
});

test("a withdrawn application can be submitted again", async () => {
  const category = await createCategory(db, "Data");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Data Engineer" });
  if (!job.ok) throw new Error(job.error);
  const first = await submitApplication(
    db,
    other,
    { jobId: job.data.id, phone: "", coverLetter: "I want to measure the hiring funnel with care and clarity.", details: "" },
    resume("data.pdf"),
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const withdrawn = await changeApplicationStatus(db, other, first.data.id, "Withdrawn", "", "Pending");
  assert.equal(withdrawn.ok, true);
  const again = await submitApplication(
    db,
    other,
    { jobId: job.data.id, phone: "", coverLetter: "I want to measure the hiring funnel with care and clarity.", details: "" },
    resume("data-2.pdf"),
  );
  assert.equal(again.ok, true);
});

test("closed jobs reject applications", async () => {
  const category = await createCategory(db, "Marketing");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Marketing Lead" });
  if (!job.ok) throw new Error(job.error);
  const { setJobStatus } = await import("../lib/services/jobs");
  await setJobStatus(db, admin, job.data.id, "closed");
  const result = await submitApplication(
    db,
    candidate,
    { jobId: job.data.id, phone: "", coverLetter: "I would like to run campaigns that sound like the product.", details: "" },
    resume("marketing.pdf"),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "closed");
});

test("a job that already has applications is archived instead of deleted", async () => {
  const { deleteJob } = await import("../lib/services/jobs");
  const removed = await deleteJob(db, admin, jobId);
  assert.equal(removed.ok, false);
  if (removed.ok) return;
  assert.equal(removed.code, "conflict");
});

test("dashboard counts come from stored applications", async () => {
  const dashboard = await getDashboard(db, "all");
  assert.ok(dashboard.applicationsInRange >= 2);
  assert.ok(dashboard.publishedJobs >= 1);
  assert.equal(
    dashboard.statusBreakdown.reduce((sum, item) => sum + item.count, 0),
    dashboard.applicationsInRange,
  );
  assert.ok(dashboard.totalCandidates >= 2);
});
