import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { getHome } from "../lib/services/dashboard";
import { createJob } from "../lib/services/jobs";
import { createCategory, createTestDb, createUser, sampleJob } from "./helpers";
import type { Database } from "../lib/db/types";

let db: Database;
let close: () => Promise<void>;

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
  const admin = await createUser(db, { email: "home@wazifa.test", name: "Home Admin", role: "admin" });
  const category = await createCategory(db, "Operations");
  await createJob(db, admin, { ...sampleJob, categoryId: category.id, title: "Operations Lead" });
});

after(async () => {
  await close();
});

test("home statistics are derived from published jobs", async () => {
  const home = await getHome(db);
  assert.equal(home.stats[0]?.value, "1");
  assert.equal(home.featured.length, 1);
  assert.equal(home.categories[0]?.name, "Operations");
  assert.equal(home.categories[0]?.count, 1);
  assert.equal(home.stats[3]?.value, "—");
});
