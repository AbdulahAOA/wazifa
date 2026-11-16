import { auditEvents } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { newId } from "@/lib/services/ids";

export async function audit(
  db: Database,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, string> = {},
) {
  await db.insert(auditEvents).values({
    id: newId(),
    actorUserId,
    action,
    entityType,
    entityId,
    metadata,
  });
}
