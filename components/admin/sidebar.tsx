"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/applications", label: "Applications", icon: FileText },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({
  collapsed: collapsedProp,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
} = {}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;
  const toggle = onToggle ?? (() => setInternalCollapsed((value) => !value));

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r-[3px] border-ink bg-ink text-white md:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b-[3px] border-white px-3 py-4">
        <Link href="/dashboard" className="min-w-0 text-xl font-black">
          {collapsed ? (
            <span className="bg-electric px-1 text-ink">W</span>
          ) : (
            <>
              WAZIFA<span className="bg-electric px-1 text-ink">ADMIN</span>
            </>
          )}
        </Link>
        {!collapsed ? (
          <button
            type="button"
            onClick={toggle}
            className="border-[2px] border-white p-1"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col p-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "mb-2 flex items-center gap-3 border-[3px] px-3 py-3 text-sm font-extrabold tracking-widest uppercase",
                collapsed && "justify-center px-2",
                active
                  ? "border-electric bg-electric text-ink"
                  : "border-transparent hover:border-white hover:bg-cobalt",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
            </Link>
          );
        })}
      </nav>
      {collapsed ? (
        <button
          type="button"
          onClick={toggle}
          className="border-t-[3px] border-white px-3 py-4"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="mx-auto size-4" />
        </button>
      ) : (
        <Link
          href="/"
          className="border-t-[3px] border-white px-5 py-4 text-xs font-extrabold tracking-widest uppercase"
        >
          ← Public site
        </Link>
      )}
    </aside>
  );
}
