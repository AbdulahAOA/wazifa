"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, LayoutDashboard, Settings, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/applications", label: "Apps", icon: FileText },
  { href: "/dashboard/users", label: "People", icon: Users },
  { href: "/dashboard/settings", label: "Set", icon: Settings },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 grid grid-cols-5 border-t-[3px] border-ink bg-ink text-white md:hidden">
      {items.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-3 text-[10px] font-extrabold uppercase ${
              active ? "bg-electric text-ink" : ""
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
