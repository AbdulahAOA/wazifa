import type { MigrationBundle } from "@/lib/db/migrations";
import { MIGRATIONS } from "@/lib/db/migrations";

export async function migrateBundle(
  exec: (statement: string) => Promise<unknown>,
  bundle: MigrationBundle,
  probe?: () => Promise<boolean>,
) {
  if (probe) {
    try {
      if (await probe()) return;
    } catch {
      /* schema_migrations may not exist yet */
    }
  }
  for (const statement of bundle.statements) {
    await exec(statement);
  }
}

export async function migrateAll(
  exec: (statement: string) => Promise<unknown>,
  probe?: (migrationId: string) => Promise<boolean>,
) {
  for (const bundle of MIGRATIONS) {
    await migrateBundle(exec, bundle, probe ? () => probe(bundle.id) : undefined);
  }
}

/** @deprecated Use migrateAll */
export async function migrate(
  exec: (statement: string) => Promise<unknown>,
  probe?: () => Promise<boolean>,
) {
  await migrateAll(exec, probe ? async (id) => id !== MIGRATIONS[0].id || (await probe()) : undefined);
}

export { MIGRATIONS };
