"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

type NavLink = { href: string; label: string };

export function NavbarMobileMenu({
  links,
  user,
  unread,
}: {
  links: NavLink[];
  user: PublicUser | null;
  unread: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="site-mobile-menu"
        aria-label="Toggle menu"
        className="border-[3px] border-ink bg-white p-2"
        onClick={() => setOpen((value) => !value)}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      {open ? (
        <div
          id="site-mobile-menu"
          className="absolute right-0 left-0 z-50 mt-2 border-[3px] border-ink bg-white px-4 py-4 shadow-[6px_6px_0_0_#111111]"
        >
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-[3px] border-ink px-3 py-3 font-extrabold uppercase"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className={cn(buttonVariants(), "w-full justify-center")}
                  onClick={() => setOpen(false)}
                >
                  Inbox{unread > 0 ? ` (${unread})` : ""}
                </Link>
                <form action={signOutAction}>
                  <Button type="submit" className="w-full">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(buttonVariants({ variant: "cobalt" }), "w-full justify-center")}
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
