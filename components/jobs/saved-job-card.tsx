import Link from "next/link";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { JobCard } from "@/components/jobs/job-card";
import { Badge } from "@/components/ui/badge";
import type { SavedJobListing } from "@/lib/types";

export function SavedJobCard({ job }: { job: SavedJobListing }) {
  return (
    <div className="relative grid gap-2">
      <div className="absolute top-3 right-3 z-10">
        <SaveJobButton jobId={job.id} saved compact />
      </div>
      {job.listingState === "closed" ? (
        <div className="border-[3px] border-ink bg-coral px-3 py-2 text-sm font-black text-white">
          This role is closed — you can still review the listing.
        </div>
      ) : null}
      {job.listingState === "unavailable" ? (
        <div className="border-[3px] border-ink bg-white p-5 hard-shadow">
          <Badge tone="pale">{job.status}</Badge>
          <p className="mt-3 text-2xl font-black">{job.title}</p>
          <p className="mt-1 font-bold">{job.company}</p>
          <p className="mt-3 text-sm">This role is no longer on the public board.</p>
          <Link href="/jobs" className="mt-4 inline-block border-[2px] border-ink bg-electric px-3 py-2 text-xs font-extrabold uppercase">
            Browse open roles
          </Link>
        </div>
      ) : (
        <JobCard job={job} />
      )}
    </div>
  );
}
