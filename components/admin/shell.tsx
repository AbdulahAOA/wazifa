"use client";

import { useState } from "react";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-full">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b-[3px] border-ink bg-paper px-4 py-3 font-black">Operator desk</div>
        <div className="flex-1 bg-paper p-4 pb-20 md:p-6 md:pb-6">{children}</div>
        <AdminMobileNav />
      </div>
    </div>
  );
}
