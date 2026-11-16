import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/jobs/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { first } from "@/lib/query";
import { adminSearch } from "@/lib/services/dashboard";

export default function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="font-black">Searching…</p>}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await liveRequest();
  const admin = await requireAdmin();
  const q = first((await searchParams).q);
  const result = q ? await adminSearch(await getDb(), admin, q) : { jobs: [], applications: [] };

  return (
    <div className="grid gap-6">
      <div>
        <p className="section-kicker">Search</p>
        <h1 className="text-4xl font-black">{q ? `RESULTS FOR “${q.toUpperCase()}”.` : "SEARCH THE DESK."}</h1>
      </div>
      <section className="border-[3px] border-ink bg-white p-5">
        <h2 className="text-2xl font-black">Jobs</h2>
        {result.jobs.length === 0 ? <p className="mt-3 font-bold">No jobs.</p> : (
          <ul className="mt-3 grid gap-2">
            {result.jobs.map((job) => (
              <li key={job.id}>
                <Link className="font-black underline" href={`/dashboard/jobs/${job.id}`}>{job.title}</Link>
                <span className="ml-2 text-sm uppercase">{job.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="border-[3px] border-ink bg-white p-5">
        <h2 className="text-2xl font-black">Applications</h2>
        {result.applications.length === 0 ? <p className="mt-3 font-bold">No applications.</p> : (
          <ul className="mt-3 grid gap-3">
            {result.applications.map((application) => (
              <li key={application.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link className="font-black underline" href={`/dashboard/applications/${application.id}`}>
                  {application.candidateName} · {application.jobTitle}
                </Link>
                <StatusBadge status={application.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
