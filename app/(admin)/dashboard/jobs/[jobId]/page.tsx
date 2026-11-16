import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { JobStatusActions } from "@/components/admin/job-status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { getAnyJob } from "@/lib/services/jobs";

type Props = { params: Promise<{ jobId: string }> };

export default function JobDetailsPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="font-black">Loading the role…</p>}>
      <JobDetails params={params} />
    </Suspense>
  );
}

async function JobDetails({ params }: Props) {
  await liveRequest();
  const { jobId } = await params;
  const result = await getAnyJob(await getDb(), jobId);
  if (!result) notFound();
  const { job, applicationCount } = result;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Role</p>
          <h1 className="text-4xl font-black">{job.title}</h1>
          <p className="mt-1 font-bold">{job.company}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/jobs/${job.id}/edit`}>Edit</Link>
          </Button>
          {job.status === "published" || job.status === "closed" ? (
            <Button variant="cobalt" asChild>
              <Link href={`/jobs/${job.id}`}>Public view</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Location" value={job.location} />
        <Stat label="Type" value={job.employmentType} />
        <Stat label="Posted" value={formatDate(job.postedAt)} />
        <Stat label="Applications" value={String(applicationCount)} />
      </div>
      <div className="border-[3px] border-ink bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {job.featured ? <Badge tone="coral">Featured</Badge> : null}
          {job.remote ? <Badge tone="cobalt">Remote</Badge> : null}
          <Badge tone="pale">{job.category}</Badge>
          <Badge tone="ink">{job.status}</Badge>
        </div>
        <p className="mt-4 leading-7">{job.description}</p>
      </div>
      <JobStatusActions jobId={job.id} status={job.status} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[3px] border-ink bg-white p-4">
      <p className="text-[10px] font-extrabold tracking-widest uppercase">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
