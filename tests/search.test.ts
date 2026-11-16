import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { escapeIlikeTerm } from "../lib/search";
import { createJob, searchJobs } from "../lib/services/jobs";
import { listUsersForAdmin } from "../lib/services/users";
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
  admin = await createUser(db, { email: "search-admin@wazifa.test", name: "Search Admin", role: "admin" });
  categoryId = (await createCategory(db, "SearchCat")).id;
});

after(async () => {
  await close();
});

test("escapeIlikeTerm neutralizes SQL wildcards", () => {
  assert.equal(escapeIlikeTerm("  %_' OR 1=1 --  "), "\\%\\_' OR 1=1 --");
});

test("search matches title, company, and description case-insensitively", async () => {
  await createJob(db, admin, {
    ...sampleJob,
    categoryId,
    title: "Senior وظيفة Analyst",
    company: "Acme Holdings",
    description: "Build dashboards with PostgreSQL and Arabic copy.",
  });
  const title = await searchJobs(db, { visibility: "public", q: "analyst" });
  assert.ok(title.jobs.some((job) => job.title.includes("Analyst")));
  const company = await searchJobs(db, { visibility: "public", q: "acme hold" });
  assert.ok(company.jobs.some((job) => job.company === "Acme Holdings"));
  const description = await searchJobs(db, { visibility: "public", q: "postgresql" });
  assert.ok(description.jobs.some((job) => job.description.includes("PostgreSQL")));
  const unicode = await searchJobs(db, { visibility: "public", q: "وظيفة" });
  assert.ok(unicode.total >= 1);
});

test("empty and whitespace-only queries return the public board", async () => {
  const empty = await searchJobs(db, { visibility: "public", q: "" });
  const spaces = await searchJobs(db, { visibility: "public", q: "   " });
  assert.ok(empty.total >= 1);
  assert.equal(empty.total, spaces.total);
});

test("no-results query and literal percent signs do not match everything", async () => {
  const none = await searchJobs(db, { visibility: "public", q: "zzznomatchzz" });
  assert.equal(none.total, 0);
  const wildcardOnly = await searchJobs(db, { visibility: "public", q: "%" });
  assert.equal(wildcardOnly.total, 0);
});

test("search combines with category and location filters", async () => {
  const berlin = await createCategory(db, "BerlinCat");
  await createJob(db, admin, {
    ...sampleJob,
    categoryId: berlin.id,
    title: "Berlin Filter Role",
    location: "Berlin, DE",
    remote: false,
  });
  const match = await searchJobs(db, {
    visibility: "public",
    q: "Berlin",
    category: "BerlinCat",
    location: "Berlin",
  });
  assert.ok(match.jobs.every((job) => job.category === "BerlinCat" && job.location.includes("Berlin")));
  assert.ok(match.jobs.some((job) => job.title === "Berlin Filter Role"));
});

test("salary sort uses numeric salaryMin and pagination respects filters", async () => {
  const low = await createJob(db, admin, { ...sampleJob, categoryId, title: "Sort Low", salaryMin: 30000 });
  const high = await createJob(db, admin, { ...sampleJob, categoryId, title: "Sort High", salaryMin: 150000 });
  assert.equal(low.ok, true);
  assert.equal(high.ok, true);
  const sorted = await searchJobs(db, { visibility: "public", sort: "salary", pageSize: 2, page: 1 });
  assert.ok(sorted.jobs.length <= 2);
  if (sorted.jobs.length >= 2) {
    assert.ok(sorted.jobs[0].salaryMin >= sorted.jobs[1].salaryMin);
  }
  const tagged = await searchJobs(db, { visibility: "public", q: "Sort", sort: "salary", pageSize: 1, page: 1 });
  const page2 = await searchJobs(db, { visibility: "public", q: "Sort", sort: "salary", pageSize: 1, page: 2 });
  assert.equal(tagged.total, 2);
  assert.notEqual(tagged.jobs[0]?.id, page2.jobs[0]?.id);
  const beyond = await searchJobs(db, { visibility: "public", q: "Sort", pageSize: 1, page: 99 });
  assert.equal(beyond.page, 2);
  assert.equal(beyond.jobs.length, 1);
});

test("admin user search requires admin and matches email", async () => {
  const candidate = await createUser(db, { email: "findme@wazifa.test", name: "Find Me" });
  const denied = await listUsersForAdmin(db, candidate, { q: "findme" });
  assert.equal(denied.ok, false);
  const allowed = await listUsersForAdmin(db, admin, { q: "findme@wazifa" });
  assert.equal(allowed.ok, true);
  if (!allowed.ok) return;
  assert.ok(allowed.data.users.some((user) => user.email === "findme@wazifa.test"));
});
