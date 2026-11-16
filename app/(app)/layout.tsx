import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { unreadCount } from "@/lib/services/notifications";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await liveRequest();
  let user = null;
  let unread = 0;
  try {
    user = await getCurrentUser();
    unread = user ? await unreadCount(await getDb(), user.id) : 0;
  } catch (error) {
    console.error("navbar:session", error);
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar user={user} unread={unread} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
