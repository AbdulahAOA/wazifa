import * as schema from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { loadEnv } from "@/lib/env";
import { migrateAll } from "@/lib/db/migrate";

const globalForDb = globalThis as unknown as {
  wazifaDb?: Promise<Database>;
  wazifaSql?: { end: (options?: { timeout?: number }) => Promise<void> };
};

export async function getDb() {
  if (!globalForDb.wazifaDb) {
    globalForDb.wazifaDb = openDatabase().catch((error: unknown) => {
      globalForDb.wazifaDb = undefined;
      throw error;
    });
  }
  return globalForDb.wazifaDb;
}

async function openDatabase(): Promise<Database> {
  const env = loadEnv();
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Start local PostgreSQL (docker compose up -d) and add DATABASE_URL to .env. See README.md.",
    );
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const client = postgres(env.databaseUrl, { max: 10 });
  try {
    await client`select 1`;
  } catch (error) {
    await client.end({ timeout: 2 }).catch(() => undefined);
    throw new Error(
      "Could not connect to PostgreSQL. Check DATABASE_URL and that the database is running.",
      { cause: error },
    );
  }
  globalForDb.wazifaSql = client;
  const db = drizzle(client, { schema });
  await migrateAll(
    (statement) => client.unsafe(statement),
    async (migrationId) => {
      const rows = await client<{ id: string }[]>`
        select id from schema_migrations where id = ${migrationId} limit 1
      `;
      return rows.length > 0;
    },
  );
  return db;
}

export async function closeDb() {
  const sql = globalForDb.wazifaSql;
  globalForDb.wazifaSql = undefined;
  globalForDb.wazifaDb = undefined;
  if (sql) await sql.end({ timeout: 2 }).catch(() => undefined);
}
