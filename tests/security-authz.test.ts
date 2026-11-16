import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { rejectCrossSitePost } from "../lib/auth/api-guard";
import {
  authenticate,
  createSession,
  destroySession,
  userFromSession,
} from "../lib/services/accounts";
import {
  changeApplicationStatus,
  getApplicationForActor,
  listAdminApplications,
  submitApplication,
} from "../lib/services/applications";
import { adminSearch } from "../lib/services/dashboard";
import { readAuthorizedFile, storeResume } from "../lib/services/files";
import { createJob } from "../lib/services/jobs";
import { deleteUserForAdmin, getUserDetailsForAdmin, listUsersForAdmin } from "../lib/services/users";
import { users } from "../lib/db/schema";
import { createCategory, createTestDb, createUser, sampleJob, TEST_SECRET } from "./helpers";
import type { Database } from "../lib/db/types";
import type { PublicUser } from "../lib/types";

let db: Database;
let close: () => Promise<void>;
let admin: PublicUser;
let candidate: PublicUser;
let other: PublicUser;
let storageDir: string;
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "wazifa-sec-"));
  admin = await createUser(db, { email: "sec-admin@wazifa.test", name: "Sec Admin", role: "admin" });
  candidate = await createUser(db, { email: "sec-a@wazifa.test", name: "Sec A" });
  other = await createUser(db, { email: "sec-b@wazifa.test", name: "Sec B" });
  const category = await createCategory(db, "Sec-Cat");
  const job = await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Sec Job" });
  if (!job.ok) throw new Error(job.error);
  await submitApplication(
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
});

after(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
  await close();
});

test("cross-site POST requests with a foreign Origin are rejected", () => {
  const request = new Request("http://localhost:3000/api/admin/delete-user", {
    method: "POST",
    headers: { origin: "https://evil.example", host: "localhost:3000" },
  });
  const blocked = rejectCrossSitePost(request);
  assert.ok(blocked);
  assert.equal(blocked?.status, 403);
});

test("candidates cannot list the admin application queue", async () => {
  const result = await listAdminApplications(db, candidate, { pageSize: 10 });
  assert.equal(result.applications.length, 0);
  assert.equal(result.total, 0);
});

test("candidates cannot run admin search", async () => {
  const result = await adminSearch(db, candidate, "Sec");
  assert.equal(result.applications.length, 0);
  assert.equal(result.jobs.length, 0);
});

test("candidates cannot load admin user details", async () => {
  const result = await getUserDetailsForAdmin(db, candidate, other.id);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});

test("candidates cannot delete users via the admin service", async () => {
  const result = await deleteUserForAdmin(db, candidate, other.id, storageDir);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});

test("candidate B cannot read candidate A application by id", async () => {
  const own = await getApplicationForActor(db, candidate, (await listAdminApplications(db, admin, { q: "Sec A" })).applications[0]!.id);
  assert.ok(own);
  const blocked = await getApplicationForActor(db, other, own!.id);
  assert.equal(blocked, null);
});

test("candidate B cannot change candidate A application status", async () => {
  const own = await getApplicationForActor(db, candidate, (await listAdminApplications(db, admin, { q: "Sec A" })).applications[0]!.id);
  assert.ok(own);
  const result = await changeApplicationStatus(db, other, own!.id, "Withdrawn", "x", own!.status);
  assert.equal(result.ok, false);
});

test("deactivated accounts cannot reuse an existing session", async () => {
  const deactivatedUser = await createUser(db, { email: "sec-deact@wazifa.test", name: "Sec Deact" });
  const login = await authenticate(db, deactivatedUser.email, "password123", TEST_SECRET);
  assert.equal(login.ok, true);
  if (!login.ok) return;
  await db.update(users).set({ deactivatedAt: new Date() }).where(eq(users.id, deactivatedUser.id));
  const session = await userFromSession(db, login.data.token, TEST_SECRET);
  assert.equal(session, null);
});

test("logout destroys the session token", async () => {
  const person = await createUser(db, { email: "sec-logout@wazifa.test", name: "Logout User" });
  const token = await createSession(db, person.id, TEST_SECRET);
  assert.ok(await userFromSession(db, token, TEST_SECRET));
  await destroySession(db, token, TEST_SECRET);
  assert.equal(await userFromSession(db, token, TEST_SECRET), null);
});

test("candidates cannot read another user's stored files", async () => {
  const stored = await storeResume(db, {
    ownerUserId: candidate.id,
    filename: "private.pdf",
    bytes: pdf,
    storageDir,
  });
  assert.equal(stored.ok, true);
  if (!stored.ok) return;
  const allowed = await readAuthorizedFile(db, candidate, stored.data.id, storageDir);
  const denied = await readAuthorizedFile(db, other, stored.data.id, storageDir);
  assert.ok(allowed);
  assert.equal(denied, null);
});

test("non-admins cannot list users for admin", async () => {
  const result = await listUsersForAdmin(db, candidate, {});
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});
