import Link from "next/link";
import { Suspense } from "react";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { UsersFilters } from "@/components/admin/users-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { listUsersForAdmin } from "@/lib/services/users";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; role?: string; sort?: string; page?: string; notice?: string; error?: string }>;
};

export default function UsersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="font-black">Loading users…</p>}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function UsersContent({ searchParams }: Props) {
  await liveRequest();
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const role = params.role === "admin" || params.role === "candidate" ? params.role : "all";
  const sort = params.sort === "name" || params.sort === "email" ? params.sort : "newest";
  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const notice = (params.notice ?? "").trim();
  const error = (params.error ?? "").trim();

  const result = await listUsersForAdmin(await getDb(), admin, { q, role, sort, page, pageSize: 20 });
  if (!result.ok) {
    return (
      <p className="border-[3px] border-ink bg-coral px-4 py-3 font-bold text-white">{result.error}</p>
    );
  }

  const { users, total, pageSize } = result.data;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (role !== "all") query.set("role", role);
  if (sort !== "newest") query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const returnPath = query.size ? `/dashboard/users?${query.toString()}` : "/dashboard/users";
  const listQuery = query.size ? `?${query.toString()}` : "";

  return (
    <div className="grid gap-5">
      {error ? (
        <p className="border-[3px] border-ink bg-coral px-4 py-3 font-bold text-white" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="border-[3px] border-ink bg-electric px-4 py-3 font-bold" role="status">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">People</p>
          <h1 className="text-4xl font-black">USERS.</h1>
          <p className="mt-2 max-w-2xl text-sm font-bold">
            Registered accounts from PostgreSQL. Passwords and session data are never shown here.
          </p>
        </div>
        <p className="border-[3px] border-ink bg-electric px-3 py-2 text-xs font-extrabold tracking-widest uppercase">
          {total} total
        </p>
      </div>
      <UsersFilters q={q} role={role} sort={sort} />
      <div className="overflow-x-auto border-[3px] border-ink bg-white">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-pale text-[10px] font-extrabold tracking-widest uppercase">
            <tr>
              <th className="border-b-[3px] border-ink px-4 py-3">Name</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Email</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Role</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Registered</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Applications</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 font-bold" colSpan={6}>
                  No users match this filter.
                </td>
              </tr>
            ) : (
              users.map((person) => (
                <tr key={person.id} className="odd:bg-white even:bg-paper">
                  <td className="border-b-[2px] border-ink px-4 py-3 font-black">
                    <Link
                      href={`/dashboard/users/${person.id}${listQuery}`}
                      className="underline decoration-2 underline-offset-4 hover:bg-electric"
                    >
                      {person.name}
                    </Link>
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{person.email}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <Badge tone={person.role === "admin" ? "cobalt" : "pale"}>
                      {person.role === "admin" ? "Admin" : "Candidate"}
                    </Badge>
                    {person.deactivated ? <Badge tone="coral" className="ml-1">Deactivated</Badge> : null}
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{formatDate(person.createdAt)}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3 font-bold">{person.applicationCount}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <UserRowActions
                      userId={person.id}
                      name={person.name}
                      email={person.email}
                      role={person.role}
                      applicationCount={person.applicationCount}
                      deactivated={person.deactivated}
                      isCurrentAdmin={person.id === admin.id}
                      returnPath={returnPath}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/users?${query.toString()}&page=${page - 1}`}>Previous</Link>
            </Button>
          ) : null}
          <span className="text-xs font-extrabold tracking-widest uppercase">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/users?${query.toString()}&page=${page + 1}`}>Next</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
