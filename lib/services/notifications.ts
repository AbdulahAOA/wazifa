import { and, count, desc, eq, isNull } from "drizzle-orm";
import { notifications, users } from "@/lib/db/schema";
import type { Database } from "@/lib/db/types";
import { newId } from "@/lib/services/ids";
import type { ApplicationStatus } from "@/lib/types";
import { safeNext } from "@/lib/validation";

const STATUS_ALERTS = new Set<ApplicationStatus>(["Under Review", "Accepted", "Rejected"]);

export async function notify(db: Database, userId: string, title: string, body: string, href: string) {
  await db.insert(notifications).values({
    id: newId(),
    userId,
    title,
    body,
    href,
  });
}

export async function notifyApplicationStatus(
  db: Database,
  candidateUserId: string,
  applicationId: string,
  status: ApplicationStatus,
  jobTitle: string,
) {
  if (!STATUS_ALERTS.has(status)) return;
  const title = `Application ${status}`;
  const body = `Your application for ${jobTitle} is now ${status}.`;
  const href = `/applications/${applicationId}`;
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, candidateUserId),
        eq(notifications.title, title),
        eq(notifications.body, body),
        eq(notifications.href, href),
      ),
    )
    .limit(1);
  if (existing) return;
  await notify(db, candidateUserId, title, body, href);
}

export async function notifyAdmins(db: Database, title: string, body: string, href: string) {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (admins.length === 0) return;
  await db.insert(notifications).values(
    admins.map((admin) => ({
      id: newId(),
      userId: admin.id,
      title,
      body,
      href,
    })),
  );
}

export async function listNotifications(db: Database, userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function unreadCount(db: Database, userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(row?.value ?? 0);
}

export async function markNotificationRead(db: Database, userId: string, notificationId: string) {
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();
  if (!row) return null;
  return safeNext(row.href, "/notifications");
}

export async function markAllRead(db: Database, userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
