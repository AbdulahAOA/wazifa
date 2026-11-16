import { Suspense } from "react";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { asDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { listNotifications } from "@/lib/services/notifications";

export const metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <p className="section-kicker">Inbox</p>
      <h1 className="mt-2 text-5xl font-black">NOTIFICATIONS.</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="font-black">Loading notifications…</div>}>
          <Inbox />
        </Suspense>
      </div>
    </div>
  );
}

async function Inbox() {
  await liveRequest();
  const user = await requireUser();
  const rows = await listNotifications(await getDb(), user.id);
  return (
    <NotificationList
      items={rows.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        read: Boolean(item.readAt),
        createdAt: asDate(item.createdAt).toISOString(),
      }))}
    />
  );
}
