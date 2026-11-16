import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { submitApplication } from "../lib/services/applications";
import { createJob } from "../lib/services/jobs";
import { deactivateUserForAdmin, deleteUserForAdmin, listUsersForAdmin } from "../lib/services/users";
import { users } from "../lib/db/schema";
import { createCategory, createTestDb, createUser, sampleJob } from "./helpers";
import type { Database } from "../lib/db/types";
import type { PublicUser } from "../lib/types";

let db: Database;
let close: () => Promise<void>;
let admin: PublicUser;
let otherAdmin: PublicUser;
let candidate: PublicUser;
let emptyCandidate: PublicUser;
let storageDir: string;
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "wazifa-users-"));
  admin = await createUser(db, { email: "ua-admin@wazifa.test", name: "UA Admin", role: "admin" });
  otherAdmin = await createUser(db, { email: "ua-admin2@wazifa.test", name: "UA Admin Two", role: "admin" });
  candidate = await createUser(db, { email: "ua-candidate@wazifa.test", name: "UA Candidate" });
  emptyCandidate = await createUser(db, { email: "ua-empty@wazifa.test", name: "UA Empty" });
  const category = await createCategory(db, "UA-Cat");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "UA Job" });
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

test("an authorized admin can delete a candidate with no applications", async () => {
  const removed = await deleteUserForAdmin(db, admin, emptyCandidate.id, storageDir);
  assert.equal(removed.ok, true);
  const listed = await listUsersForAdmin(db, admin, { q: "ua-empty@wazifa.test" });
  assert.equal(listed.ok, true);
  if (!listed.ok) return;
  assert.equal(listed.data.users.length, 0);
});

test("an admin cannot delete their own account", async () => {
  const result = await deleteUserForAdmin(db, admin, admin.id, storageDir);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});

test("an admin cannot delete another admin account", async () => {
  const result = await deleteUserForAdmin(db, admin, otherAdmin.id, storageDir);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});

test("candidates cannot delete users", async () => {
  const target = await createUser(db, { email: "ua-block@wazifa.test", name: "UA Block" });
  const result = await deleteUserForAdmin(db, candidate, target.id, storageDir);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});

test("deletion is blocked when the user has applications; deactivation succeeds", async () => {
  const blocked = await deleteUserForAdmin(db, admin, candidate.id, storageDir);
  assert.equal(blocked.ok, false);
  if (blocked.ok) return;
  assert.equal(blocked.code, "conflict");
  const deactivated = await deactivateUserForAdmin(db, admin, candidate.id);
  assert.equal(deactivated.ok, true);
  const [row] = await db.select().from(users).where(eq(users.id, candidate.id)).limit(1);
  assert.ok(row?.deactivatedAt);
});
