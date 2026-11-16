import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createJob, deleteJob, getPublicJob, searchJobs, setJobStatus } from "../lib/services/jobs";
import { parseJobInput } from "../lib/validation";
import { createCategory, createTestDb, createUser, sampleJob } from "./helpers";
import type { Database } from "../lib/db/types";
import type { PublicUser } from "../lib/types";

let db: Database;
let close: () => Promise<void>;
let admin: PublicUser;
let categoryId: string;

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  admin = await createUser(db, { email: "operator@wazifa.test", name: "Operator", role: "admin" });
  categoryId = (await createCategory(db)).id;
});

after(async () => {
  await close();
});

test("job input rejects an empty title", () => {
  const result = parseJobInput({ title: "A", company: "Acme", description: "short" });
  assert.equal(result.ok, false);
});

test("draft jobs stay off the public board until published", async () => {
  const created = await createJob(db, admin, { ...sampleJob, categoryId, publish: false, title: "Hidden Draft Role" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.data.status, "draft");
  assert.equal(await getPublicJob(db, created.data.id), null);
  const published = await setJobStatus(db, admin, created.data.id, "published");
  assert.equal(published.ok, true);
  const visible = await getPublicJob(db, created.data.id);
  assert.equal(visible?.title, "Hidden Draft Role");
});

test("public search filters by category, remote, and salary and ignores wildcard injection", async () => {
  await createJob(db, admin, { ...sampleJob, categoryId, title: "Cairo Designer", remote: false, salaryMin: 40000 });
  const design = await createCategory(db, "Design");
  await createJob(db, admin, {
    ...sampleJob,
    categoryId: design.id,
    title: "Remote Designer",
    remote: true,
    salaryMin: 90000,
    location: "Berlin",
  });
  const byCategory = await searchJobs(db, { visibility: "public", category: "Design" });
  assert.ok(byCategory.jobs.every((job) => job.category === "Design"));
  assert.ok(byCategory.jobs.some((job) => job.title === "Remote Designer"));
  const remote = await searchJobs(db, { visibility: "public", remote: true, salaryMin: 80000 });
  assert.ok(remote.jobs.every((job) => job.remote && job.salaryMin >= 80000));
  const injected = await searchJobs(db, { visibility: "public", q: "%' OR 1=1 --" });
  assert.equal(injected.jobs.length, 0);
});

test("closing a job removes it from public search", async () => {
  const created = await createJob(db, admin, { ...sampleJob, categoryId, title: "Closing Role" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const closed = await setJobStatus(db, admin, created.data.id, "closed");
  assert.equal(closed.ok, true);
  const found = await searchJobs(db, { visibility: "public", q: "Closing Role" });
  assert.equal(found.total, 0);
  const direct = await getPublicJob(db, created.data.id);
  assert.equal(direct?.status, "closed");
});

test("a draft with no applications can be deleted", async () => {
  const created = await createJob(db, admin, { ...sampleJob, categoryId, title: "Disposable Draft", publish: false });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const removed = await deleteJob(db, admin, created.data.id);
  assert.equal(removed.ok, true);
});

test("a candidate cannot create a job", async () => {
  const candidate = await createUser(db, { email: "seeker@wazifa.test", name: "Seeker" });
  const result = await createJob(db, candidate, { ...sampleJob, categoryId });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "forbidden");
});
