import Link from "next/link";
import { Suspense } from "react";
import { JobRowActions } from "@/components/admin/job-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { applicationCountsForJobs, searchJobs } from "@/lib/services/jobs";

export default function JobsManagementPage() {
  return (
    <Suspense fallback={<p className="font-black">Loading jobs…</p>}>
      <JobsContent />
    </Suspense>
  );
}

async function JobsContent() {
  await liveRequest();
  const db = await getDb();
  const result = await searchJobs(db, { visibility: "admin", sort: "newest", pageSize: 50 });
  const counts = await applicationCountsForJobs(db, result.jobs.map((job) => job.id));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Catalog</p>
          <h1 className="text-4xl font-black">JOBS.</h1>
        </div>
        <Button variant="cobalt" asChild>
          <Link href="/dashboard/jobs/new">New job</Link>
        </Button>
      </div>
      <div className="overflow-x-auto border-[3px] border-ink bg-white">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-pale text-[10px] font-extrabold tracking-widest uppercase">
            <tr>
              <th className="border-b-[3px] border-ink px-4 py-3">Title</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Company</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Location</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Type</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Status</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Posted</th>
              <th className="border-b-[3px] border-ink px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.jobs.length === 0 ? (
              <tr>
                <td className="px-4 py-6 font-bold" colSpan={7}>
                  No jobs yet. Publish the first role.
                </td>
              </tr>
            ) : (
              result.jobs.map((job) => (
                <tr key={job.id} className="odd:bg-white even:bg-paper">
                  <td className="border-b-[2px] border-ink px-4 py-3 font-black">
                    <Link href={`/dashboard/jobs/${job.id}`} className="underline">
                      {job.title}
                    </Link>
                    {job.featured ? (
                      <span className="ml-2">
                        <Badge tone="coral">Featured</Badge>
                      </span>
                    ) : null}
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{job.company}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{job.location}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{job.employmentType}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <Badge tone="ink">{job.status}</Badge>
                  </td>
                  <td className="border-b-[2px] border-ink px-4 py-3">{formatDate(job.postedAt)}</td>
                  <td className="border-b-[2px] border-ink px-4 py-3">
                    <JobRowActions
                      jobId={job.id}
                      jobTitle={job.title}
                      applicationCount={counts.get(job.id) ?? 0}
                      status={job.status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
