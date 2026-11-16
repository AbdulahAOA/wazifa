import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import { users } from "../lib/db/schema";
import { registerUser } from "../lib/services/accounts";

async function main() {
  const email = `disposable-delete-${Date.now()}@wazifa.test`;
  const db = await getDb();
  const registered = await registerUser(db, {
    email,
    name: "Disposable Delete Me",
    password: randomBytes(24).toString("base64url"),
  });
  if (!registered.ok) throw new Error(registered.error);
  const [row] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
  console.log(JSON.stringify({ id: row?.id, email: row?.email }));
}

main()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    closeDb().finally(() => process.exit(1));
  });
