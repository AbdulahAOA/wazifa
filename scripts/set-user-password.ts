import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { closeDb, getDb } from "../lib/db/client";
import { users } from "../lib/db/schema";
import { loadEnv } from "../lib/env";
import { authenticate } from "../lib/services/accounts";
import { normalizeEmail } from "../lib/validation";

async function main() {
  loadEnv();
  const email = normalizeEmail(process.argv[2] ?? "");
  const password = process.argv[3] ?? "";
  if (!email || !password) {
    console.error("Usage: tsx scripts/set-user-password.ts <email> <password>");
    process.exit(1);
  }
  if (password.length < 8 || password.length > 200 || password.trim().length === 0) {
    console.error("Password must be between 8 and 200 characters and not be whitespace-only.");
    process.exit(1);
  }

  const db = await getDb();
  const [row] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email)).limit(1);
  if (!row) {
    console.error(`No user found for ${email}.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.id));

  const login = await authenticate(db, email, password, loadEnv().sessionSecret);
  if (!login.ok) {
    console.error("Password was updated but login verification failed.");
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      email,
      role: login.data.user.role,
      login: "ok",
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => closeDb());
