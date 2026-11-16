import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import {
  authenticate,
  registerUser,
  requestPasswordReset,
  resetPassword,
  userFromSession,
  destroySession,
} from "../lib/services/accounts";
import { sessions } from "../lib/db/schema";
import { createTestDb, createUser, TEST_SECRET } from "./helpers";
import type { Database } from "../lib/db/types";

let db: Database;
let close: () => Promise<void>;

before(async () => {
  const testDb = await createTestDb();
  db = testDb.db;
  close = testDb.close;
});

after(async () => {
  await close();
});

test("registration always creates a candidate, even when the email contains admin", async () => {
  const result = await registerUser(db, {
    email: "admin@wazifa.test",
    password: "password123",
    name: "Not An Operator",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.role, "candidate");
});

test("login accepts the password and rejects a wrong one without granting a role from the email", async () => {
  const good = await authenticate(db, "admin@wazifa.test", "password123", TEST_SECRET);
  assert.equal(good.ok, true);
  if (!good.ok) return;
  assert.equal(good.data.user.role, "candidate");
  const user = await userFromSession(db, good.data.token, TEST_SECRET);
  assert.equal(user?.id, good.data.user.id);
  const bad = await authenticate(db, "admin@wazifa.test", "wrong-password", TEST_SECRET);
  assert.equal(bad.ok, false);
});

test("expired sessions are rejected", async () => {
  const good = await authenticate(db, "admin@wazifa.test", "password123", TEST_SECRET);
  assert.equal(good.ok, true);
  if (!good.ok) return;
  await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.userId, good.data.user.id));
  const user = await userFromSession(db, good.data.token, TEST_SECRET);
  assert.equal(user, null);
});

test("password reset rotates the password once and invalidates sessions", async () => {
  const person = await createUser(db, { email: "reset@wazifa.test", name: "Reset User", password: "old-password" });
  const issued = await requestPasswordReset(db, person.email, TEST_SECRET, true);
  assert.ok(issued.devResetUrl);
  const token = new URL(`http://localhost${issued.devResetUrl}`).searchParams.get("token");
  assert.ok(token);
  const session = await authenticate(db, person.email, "old-password", TEST_SECRET);
  assert.equal(session.ok, true);
  const reset = await resetPassword(db, token!, "new-password", TEST_SECRET);
  assert.equal(reset.ok, true);
  const reused = await resetPassword(db, token!, "another-password", TEST_SECRET);
  assert.equal(reused.ok, false);
  const oldLogin = await authenticate(db, person.email, "old-password", TEST_SECRET);
  assert.equal(oldLogin.ok, false);
  const newLogin = await authenticate(db, person.email, "new-password", TEST_SECRET);
  assert.equal(newLogin.ok, true);
  if (session.ok) {
    await destroySession(db, session.data.token, TEST_SECRET);
    assert.equal(await userFromSession(db, session.data.token, TEST_SECRET), null);
  }
});

test("duplicate registration is rejected", async () => {
  const again = await registerUser(db, { email: "admin@wazifa.test", password: "password123", name: "Again" });
  assert.equal(again.ok, false);
  if (again.ok) return;
  assert.equal(again.code, "duplicate");
});
