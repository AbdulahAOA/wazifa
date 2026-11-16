import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { submitApplication } from "../lib/services/applications";
import { createJob } from "../lib/services/jobs";
import { getUserDetailsForAdmin } from "../lib/services/users";
import { createCategory, createTestDb, createUser, sampleJob } from "./helpers";
import type { Database } from "../lib/db/types";
import type { PublicUser } from "../lib/types";

let db: Database;
let close: () => Promise<void>;
let admin: PublicUser;
let candidate: PublicUser;
let emptyCandidate: PublicUser;
let otherCandidate: PublicUser;
let storageDir: string;
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "wazifa-user-details-"));
  admin = await createUser(db, { email: "uad-admin@wazifa.test", name: "UAD Admin", role: "admin" });
  candidate = await createUser(db, { email: "uad-candidate@wazifa.test", name: "UAD Candidate" });
  emptyCandidate = await createUser(db, { email: "uad-empty@wazifa.test", name: "UAD Empty" });
  otherCandidate = await createUser(db, { email: "uad-other@wazifa.test", name: "UAD Other" });
  const category = await createCategory(db, "UAD-Cat");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "UAD Job" });
  if (!job.ok) throw new Error(job.error);
  const applied = await submitApplication(
    db,
    candidate,
    {
      jobId: job.data.id,
      phone: "",
      coverLetter: "I would love to join this team and contribute to the product roadmap with clear communication.",
      details: "",
    },
    { filename: "cv.pdf", bytes: pdf, storageDir },
  );
  assert.equal(applied.ok, true);
});

after(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
  await close();
});

test("an admin can load a candidate with application history", async () => {
  const result = await getUserDetailsForAdmin(db, admin, candidate.id);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.email, "uad-candidate@wazifa.test");
  assert.equal(result.data.applicationCount, 1);
  assert.equal(result.data.applications.length, 1);
  assert.equal(result.data.applications[0]?.candidateUserId, candidate.id);
  assert.equal(result.data.applications[0]?.jobTitle, "UAD Job");
});

test("a candidate with zero applications returns an empty history", async () => {
  const result = await getUserDetailsForAdmin(db, admin, emptyCandidate.id);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.applicationCount, 0);
  assert.equal(result.data.applications.length, 0);
});

test("a missing user id returns not_found", async () => {
  const result = await getUserDetailsForAdmin(db, admin, "00000000-0000-0000-0000-000000000000");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "not_found");
});

test("non-admins cannot load user details", async () => {
  const result = await getUserDetailsForAdmin(db, candidate, otherCandidate.id);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});

test("application history is scoped to the selected candidate only", async () => {
  const withApps = await getUserDetailsForAdmin(db, admin, candidate.id);
  const withoutApps = await getUserDetailsForAdmin(db, admin, otherCandidate.id);
  assert.equal(withApps.ok, true);
  assert.equal(withoutApps.ok, true);
  if (!withApps.ok || !withoutApps.ok) return;
  assert.ok(withApps.data.applications.every((row) => row.candidateUserId === candidate.id));
  assert.equal(withoutApps.data.applicationCount, 0);
});
