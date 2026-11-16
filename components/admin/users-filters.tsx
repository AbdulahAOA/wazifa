"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UsersFilters({
  q,
  role,
  sort,
}: {
  q: string;
  role: string;
  sort: string;
}) {
  const router = useRouter();

  return (
    <form
      className="grid gap-3 border-[3px] border-ink bg-white p-4 md:grid-cols-[1fr_auto_auto_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        const nextQ = String(data.get("q") ?? "").trim();
        const nextRole = String(data.get("role") ?? "all");
        const nextSort = String(data.get("sort") ?? "newest");
        if (nextQ) params.set("q", nextQ);
        if (nextRole !== "all") params.set("role", nextRole);
        if (nextSort !== "newest") params.set("sort", nextSort);
        router.push(`/dashboard/users?${params.toString()}`);
      }}
    >
      <div className="grid gap-1">
        <label htmlFor="user-q" className="text-[10px] font-extrabold tracking-widest uppercase">Search</label>
        <Input id="user-q" name="q" defaultValue={q} placeholder="Name or email" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="user-role" className="text-[10px] font-extrabold tracking-widest uppercase">Role</label>
        <select
          id="user-role"
          name="role"
          defaultValue={role}
          className="h-12 border-[3px] border-ink bg-white px-3 font-bold"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="candidate">Candidate</option>
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="user-sort" className="text-[10px] font-extrabold tracking-widest uppercase">Sort</label>
        <select
          id="user-sort"
          name="sort"
          defaultValue={sort}
          className="h-12 border-[3px] border-ink bg-white px-3 font-bold"
        >
          <option value="newest">Newest first</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" variant="cobalt">Apply</Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/users">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
