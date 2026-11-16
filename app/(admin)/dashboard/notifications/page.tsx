import { Suspense } from "react";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { asDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { listNotifications } from "@/lib/services/notifications";

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<p className="font-black">Loading notifications…</p>}>
      <Inbox />
    </Suspense>
  );
}

async function Inbox() {
  await liveRequest();
  const admin = await requireAdmin();
  const rows = await listNotifications(await getDb(), admin.id);
  return (
    <div className="grid max-w-3xl gap-5">
      <div>
        <p className="section-kicker">Inbox</p>
        <h1 className="text-4xl font-black">NOTIFICATIONS.</h1>
      </div>
      <NotificationList
        items={rows.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          read: Boolean(item.readAt),
          createdAt: asDate(item.createdAt).toISOString(),
        }))}
      />
    </div>
  );
}
