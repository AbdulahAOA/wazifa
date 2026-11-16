import { eq, or } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import { authenticate } from "../lib/services/accounts";
import { loadEnv } from "../lib/env";
import { users } from "../lib/db/schema";

async function main() {
  const secret = loadEnv().sessionSecret;
  const oldPassword = process.env.VERIFY_CANDIDATE_OLD_PASSWORD;
  const newPassword = process.env.VERIFY_CANDIDATE_NEW_PASSWORD;
  if (!oldPassword || !newPassword) {
    throw new Error("Set VERIFY_CANDIDATE_OLD_PASSWORD and VERIFY_CANDIDATE_NEW_PASSWORD in your private .env before running this diagnostic.");
  }
  const db = await getDb();
  const [row] = await db
    .select({ role: users.role, name: users.name, email: users.email })
    .from(users)
    .where(
      or(
        eq(users.email, "verify.candidate.1025@wazifa.test"),
        eq(users.email, "e2e.candidate.1025@wazifa.test"),
      ),
    )
    .limit(1);
  if (!row) {
    console.log(JSON.stringify({ found: false }));
    return;
  }
  const oldPass = await authenticate(db, row.email, oldPassword, secret);
  const newPass = await authenticate(db, row.email, newPassword, secret);
  console.log(
    JSON.stringify({
      oldPassword: oldPass.ok ? "accepted" : "rejected",
      newPassword: newPass.ok ? newPass.data.user.role : newPass,
      role: row.role,
      found: true,
    }),
  );
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
