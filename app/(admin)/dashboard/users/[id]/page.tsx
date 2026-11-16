import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { getUserDetailsForAdmin } from "@/lib/services/users";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; role?: string; sort?: string; page?: string; notice?: string; error?: string }>;
};

export default function UserDetailsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<p className="font-black">Loading user…</p>}>
      <UserDetailsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function usersListPath(params: {
  q?: string;
  role?: string;
  sort?: string;
  page?: string;
  notice?: string;
  error?: string;
}) {
  const query = new URLSearchParams();
  const q = (params.q ?? "").trim();
  const role = params.role === "admin" || params.role === "candidate" ? params.role : "all";
  const sort = params.sort === "name" || params.sort === "email" ? params.sort : "newest";
  const page = Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1);
  const notice = (params.notice ?? "").trim();
  const error = (params.error ?? "").trim();
  if (q) query.set("q", q);
  if (role !== "all") query.set("role", role);
  if (sort !== "newest") query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  if (notice) query.set("notice", notice);
  if (error) query.set("error", error);
  return query.size ? `/dashboard/users?${query.toString()}` : "/dashboard/users";
}

async function UserDetailsContent({ params, searchParams }: Props) {
  await liveRequest();
  const admin = await requireAdmin();
  const { id } = await params;
  const listParams = await searchParams;
  const backHref = usersListPath(listParams);
  const returnPath = backHref;

  const result = await getUserDetailsForAdmin(await getDb(), admin, id);
  if (!result.ok) {
    if (result.code === "not_found") notFound();
    return (
      <p className="border-[3px] border-ink bg-coral px-4 py-3 font-bold text-white">{result.error}</p>
    );
  }

  const person = result.data;
  const listNotice = (listParams.notice ?? "").trim();
  const listError = (listParams.error ?? "").trim();

  return (
    <div className="grid gap-5">
      {listError ? (
        <p className="border-[3px] border-ink bg-coral px-4 py-3 font-bold text-white" role="alert">
          {listError}
        </p>
      ) : null}
      {listNotice ? (
        <p className="border-[3px] border-ink bg-electric px-4 py-3 font-bold" role="status">
          {listNotice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>← Back to users</Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">People</p>
          <h1 className="text-4xl font-black">{person.name}</h1>
          <p className="mt-1 font-bold">{person.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={person.role === "admin" ? "cobalt" : "pale"}>
            {person.role === "admin" ? "Admin" : "Candidate"}
          </Badge>
          {person.deactivated ? <Badge tone="coral">Deactivated</Badge> : <Badge tone="electric">Active</Badge>}
        </div>
      </div>
      <div className="grid gap-4 border-[3px] border-ink bg-white p-5 hard-shadow sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Registered" value={formatDate(person.createdAt)} />
        <Info label="Applications" value={String(person.applicationCount)} />
        <Info label="Account" value={person.deactivated ? "Deactivated" : "Active"} />
        <Info label="Role" value={person.role === "admin" ? "Admin" : "Candidate"} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Application history</h2>
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
      </div>
      {person.applications.length === 0 ? (
        <p className="border-[3px] border-ink bg-pale px-4 py-8 text-center font-bold">
          This candidate has not submitted any applications yet.
        </p>
      ) : (
        <div className="overflow-x-auto border-[3px] border-ink bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-pale text-[10px] font-extrabold tracking-widest uppercase">
              <tr>
                <th className="border-b-[3px] border-ink px-4 py-3">Job</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Company</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Submitted</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Status</th>
                <th className="border-b-[3px] border-ink px-4 py-3">Manage</th>
              </tr>
            </thead>
            <tbody>
              {person.applications.map((application) => (
                <tr key={application.id} className="odd:bg-white even:bg-paper">
                  <td className="border-b-[2px] border-ink px-4 py-3 font-black">
                    <Link
                      href={`/dashboard/jobs/${application.jobId}`}
                      className="underline decoration-2 underline-offset-2 hover:bg-electric"
                    >
                      {application.jobTitle}
                    </Link>
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{application.company}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{formatDate(application.submittedAt)}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <Link
                      href={`/dashboard/applications/${application.id}`}
                      className="text-xs font-extrabold uppercase underline"
                    >
                      View application
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold tracking-widest uppercase">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
