import { Suspense } from "react";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { unreadCount } from "@/lib/services/notifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await liveRequest();
  const user = await requireAdmin();
  return (
    <Suspense fallback={<div className="p-6 text-2xl font-black">Loading the desk…</div>}>
      <Shell userId={user.id} name={user.name}>
        {children}
      </Shell>
    </Suspense>
  );
}

async function Shell({
  children,
  userId,
  name,
}: {
  children: React.ReactNode;
  userId: string;
  name: string;
}) {
  const unread = await unreadCount(await getDb(), userId);
  return (
    <div className="flex min-h-full">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar name={name} unread={unread} />
        <div className="flex-1 bg-paper p-4 pb-20 md:p-6 md:pb-6">{children}</div>
        <AdminMobileNav />
      </div>
    </div>
  );
}
