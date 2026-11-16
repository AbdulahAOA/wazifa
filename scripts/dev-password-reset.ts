import { closeDb, getDb } from "../lib/db/client";
import { loadEnv } from "../lib/env";
import { requestPasswordReset } from "../lib/services/accounts";
import { normalizeEmail } from "../lib/validation";

async function main() {
  const email = normalizeEmail(process.argv[2] ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: tsx scripts/dev-password-reset.ts <email>");
    process.exit(1);
  }
  if (loadEnv().isProd) {
    console.error("This helper is disabled in production.");
    process.exit(1);
  }
  const result = await requestPasswordReset(await getDb(), email, loadEnv().sessionSecret, true);
  if (!result.devResetUrl) {
    console.log("No reset link was created for that address.");
    process.exit(0);
  }
  console.log(`Reset link (local dev only): http://localhost:3000${result.devResetUrl}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => closeDb());
