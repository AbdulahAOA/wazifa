import postgres from "postgres";
import { loadEnv, resetEnvCache } from "../lib/env";
// Isolated probe; does not import getDb so it can fail fast without running migrations.

async function main() {
  resetEnvCache();
  const env = loadEnv();
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = postgres(env.databaseUrl, { max: 1, connect_timeout: 8 });
  try {
    const rows = await sql`select current_database() as db`;
    console.log(`Connected to database ${rows[0]?.db}.`);
    await sql.end({ timeout: 2 });
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : "connection failed";
    console.error(`Could not connect: ${message}`);
    try {
      await sql.end({ timeout: 1 });
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();
