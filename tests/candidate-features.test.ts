import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { updateProfile } from "../lib/services/accounts";
import { changeApplicationStatus, submitApplication } from "../lib/services/applications";
import { createJob, isJobSaved, listSavedJobs, setJobStatus, toggleSavedJob } from "../lib/services/jobs";
import { listNotifications, markNotificationRead, notify, notifyApplicationStatus } from "../lib/services/notifications";
import { createCategory, createTestDb, createUser, sampleJob } from "./helpers";
import type { Database } from "../lib/db/types";
import type { PublicUser } from "../lib/types";

let db: Database;
let close: () => Promise<void>;
let admin: PublicUser;
let candidate: PublicUser;
let other: PublicUser;
let jobId: string;
let storageDir: string;
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "wazifa-cf-"));
  admin = await createUser(db, { email: "cf-admin@wazifa.test", name: "CF Admin", role: "admin" });
  candidate = await createUser(db, { email: "cf-candidate@wazifa.test", name: "CF Candidate" });
  other = await createUser(db, { email: "cf-other@wazifa.test", name: "CF Other" });
  const category = await createCategory(db, "CF-Cat");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "CF Role" });
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

test("candidates can update profile fields including skills and experience", async () => {
  const result = await updateProfile(db, candidate, {
    name: "CF Candidate Updated",
    phone: "+201234567890",
    headline: "Full-stack builder",
    location: "Cairo",
    bio: "Shipping hiring tools.",
    skills: ["TypeScript", "PostgreSQL"],
    experience: [{ title: "Engineer", company: "Acme", period: "2020–2024", summary: "APIs" }],
    education: [{ school: "Cairo U", degree: "BSc CS", year: "2020" }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.name, "CF Candidate Updated");
  assert.deepEqual(result.data.skills, ["TypeScript", "PostgreSQL"]);
  assert.equal(result.data.experience[0]?.company, "Acme");
});

test("saved jobs are unique per user and scoped to the owner", async () => {
  const save = await toggleSavedJob(db, other, jobId);
  assert.equal(save.ok, true);
  if (!save.ok) return;
  assert.equal(save.data.saved, true);
  assert.equal(await isJobSaved(db, other.id, jobId), true);
  assert.equal(await isJobSaved(db, candidate.id, jobId), false);
  const unsave = await toggleSavedJob(db, other, jobId);
  assert.equal(unsave.ok, true);
  if (!unsave.ok) return;
  assert.equal(unsave.data.saved, false);
  const mine = await listSavedJobs(db, other.id);
  assert.equal(mine.length, 0);
});

test("status change notifications are created for review outcomes without duplicates", async () => {
  const applied = await submitApplication(
    db,
    candidate,
    {
      jobId,
      phone: "",
      coverLetter: "I would love to join this team and contribute to the product roadmap with clear communication.",
      details: "",
    },
    resume(),
  );
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  const moved = await changeApplicationStatus(db, admin, applied.data.id, "Under Review", "", "Pending");
  assert.equal(moved.ok, true);
  const inbox = await listNotifications(db, candidate.id);
  assert.ok(inbox.some((item) => item.title === "Application Under Review" && item.body.includes("CF Role")));
  await notifyApplicationStatus(db, candidate.id, applied.data.id, "Under Review", "CF Role");
  const afterDup = await listNotifications(db, candidate.id);
  assert.equal(
    afterDup.filter((item) => item.title === "Application Under Review" && item.body.includes("CF Role")).length,
    1,
  );
});

test("candidates cannot mark another user's notifications as read", async () => {
  await notify(db, candidate.id, "Private note", "Only for candidate", "/notifications");
  const rows = await listNotifications(db, candidate.id);
  const note = rows.find((item) => item.title === "Private note");
  assert.ok(note);
  const href = await markNotificationRead(db, other.id, note!.id);
  assert.equal(href, null);
});

test("archived jobs appear as unavailable on the saved list", async () => {
  const category = await createCategory(db, "CF-Archive");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Archive Me" });
  assert.equal(job.ok, true);
  if (!job.ok) return;
  const saved = await toggleSavedJob(db, candidate, job.data.id);
  assert.equal(saved.ok, true);
  await setJobStatus(db, admin, job.data.id, "archived");
  const listings = await listSavedJobs(db, candidate.id);
  const row = listings.find((item) => item.id === job.data.id);
  assert.ok(row);
  assert.equal(row?.listingState, "unavailable");
});
