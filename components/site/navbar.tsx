import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { NavbarMobileMenu } from "@/components/site/navbar-mobile-menu";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

export function Navbar({ user, unread }: { user: PublicUser | null; unread: number }) {
  const links = [
    { href: "/jobs", label: "Jobs" },
    ...(user
      ? [
          { href: "/applications", label: "My Applications" },
          { href: "/saved", label: "Saved" },
          { href: "/profile", label: "Profile" },
        ]
      : []),
    ...(user?.role === "admin" ? [{ href: "/dashboard", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="flex items-center justify-between gap-4 border-b-[3px] border-ink bg-ink px-4 py-2 text-white md:px-6">
        <p className="text-[10px] font-extrabold tracking-[0.22em] uppercase">
          Hard edges. Clear hiring. No beige software.
        </p>
        <p className="hidden text-[10px] font-extrabold tracking-[0.22em] uppercase sm:block">
          Apply once. Track everything.
        </p>
      </div>
      <div className="border-b-[3px] border-ink bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="border-[3px] border-ink bg-electric px-3 py-1 text-2xl font-black tracking-tight">
            WAZIFA
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-[3px] border-transparent px-3 py-2 text-xs font-extrabold tracking-widest uppercase hover:border-ink hover:bg-electric"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Inbox{unread > 0 ? ` (${unread})` : ""}
                </Link>
                <form action={signOutAction}>
                  <Button type="submit" variant="outline" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Sign In
                </Link>
                <Link href="/sign-up" className={cn(buttonVariants({ variant: "cobalt", size: "sm" }))}>
                  Get Started
                </Link>
              </>
            )}
          </div>
          <NavbarMobileMenu links={links} user={user} unread={unread} />
        </div>
      </div>
    </header>
  );
}
