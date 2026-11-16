import { markAllNotificationsReadAction, openNotificationAction } from "@/app/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <div className="grid gap-4">
      <form action={markAllNotificationsReadAction}>
        <SubmitButton variant="outline" pendingLabel="Updating…">Mark all read</SubmitButton>
      </form>
      {items.length === 0 ? (
        <div className="border-[3px] border-ink bg-white p-8">
          <p className="text-2xl font-black">No notifications.</p>
        </div>
      ) : (
        items.map((item) => (
          <form key={item.id} action={openNotificationAction} className={`border-[3px] border-ink p-4 ${item.read ? "bg-white" : "bg-electric"}`}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="text-left">
              <p className="text-xs font-extrabold tracking-widest uppercase">{formatDate(item.createdAt)}</p>
              <p className="text-xl font-black">{item.title}</p>
              <p className="mt-1">{item.body}</p>
            </button>
          </form>
        ))
      )}
    </div>
  );
}
