import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { companyTag } from "@/lib/format";

export function AdminTopbar({ name, unread }: { name: string; unread: number }) {
  const initials = companyTag(name);

  return (
    <header className="flex items-center justify-between gap-3 border-b-[3px] border-ink bg-paper px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link href="/dashboard" className="border-[3px] border-ink bg-electric px-2 py-1 font-black md:hidden">
          WA
        </Link>
        <form action="/dashboard/search" className="min-w-0 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-3.5 left-3 size-4" />
            <Input name="q" placeholder="Search jobs, applicants…" className="pl-10" />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard/notifications" className="relative border-[3px] border-ink bg-white p-2" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -top-2 -right-2 min-w-5 border-[2px] border-ink bg-coral px-1 text-center text-[10px] font-black text-white">
              {unread}
            </span>
          ) : null}
        </Link>
        <div className="hidden items-center gap-2 border-[3px] border-ink bg-white px-2 py-1 sm:flex">
          <div className="flex size-8 items-center justify-center bg-cobalt text-xs font-black text-white">{initials}</div>
          <div>
            <p className="text-xs leading-none font-black">{name}</p>
            <p className="text-[10px] font-extrabold tracking-widest uppercase">Operator</p>
          </div>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      </div>
    </header>
  );
}
