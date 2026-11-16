import { type SQL, sql } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

/** Escape `%`, `_`, and `\` for use with `ILIKE ... ESCAPE '\\'`. */
export function escapeIlikeTerm(value: string) {
  return value
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

export function ilikeContains(column: AnyColumn, raw: string): SQL | undefined {
  const escaped = escapeIlikeTerm(raw);
  if (!escaped) return undefined;
  const pattern = `%${escaped}%`;
  return sql`${column} ILIKE ${pattern} ESCAPE '\\'`;
}
