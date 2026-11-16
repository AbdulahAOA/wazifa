import { closeDb, getDb } from "../lib/db/client";
import { authenticate } from "../lib/services/accounts";
import { loadEnv } from "../lib/env";

async function main() {
  loadEnv();
  const email = (process.argv[2] ?? process.env.SEED_ADMIN_EMAIL ?? "admin@wazifa.local").trim().toLowerCase();
  const password = process.argv[3] ?? process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!password) {
    console.error("Missing password argument or SEED_ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  const env = loadEnv();
  const result = await authenticate(await getDb(), email, password, env.sessionSecret);
  if (!result.ok) {
    console.error("Authentication failed");
    process.exit(1);
  }
  process.stdout.write(result.data.token);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => closeDb());
