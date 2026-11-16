import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";

export type Database = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;
