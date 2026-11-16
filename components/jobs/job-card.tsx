import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Badge } from "@/components/ui/badge";
import { formatDate, isNew } from "@/lib/format";
import type { Job } from "@/lib/types";

const referenceNow = Date.parse("2026-10-25T00:00:00.000Z");

function locationLabel(job: Job) {
  if (job.remote && job.location.trim()) return `${job.location} · Remote`;
  if (job.remote) return "Remote";
  return job.location.trim() || "Location not specified";
}

function salaryLabel(job: Job) {
  const hasNumericSalary = job.salaryMin > 0 || (job.salaryMax ?? 0) > 0;
  const label = job.salary.trim();
  if (hasNumericSalary && label) return label;
  if (label && !/^from \$0/i.test(label) && label !== "$0") return label;
  return null;
}

export function JobCard({
  job,
  href,
  saved,
  showSave,
}: {
  job: Job;
  href?: string;
  saved?: boolean;
  showSave?: boolean;
}) {
  const salary = salaryLabel(job);
  const detailHref = href ?? `/jobs/${job.id}`;

  return (
    <div className="relative h-full">
      {showSave ? (
        <div className="absolute top-3 right-3 z-10">
          <SaveJobButton jobId={job.id} saved={Boolean(saved)} compact />
        </div>
      ) : null}
    <Link
      href={detailHref}
      className="group flex h-full min-h-[20rem] flex-col border-[3px] border-ink bg-white p-5 text-ink hard-shadow transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#111111]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center border-[3px] border-ink bg-electric text-sm font-black">
          {job.companyTag}
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {job.featured ? <Badge tone="coral">Featured</Badge> : null}
          {job.remote ? <Badge tone="cobalt">Remote</Badge> : null}
          {isNew(job.postedAt, referenceNow) ? <Badge tone="electric">New</Badge> : null}
        </div>
      </div>

      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-ink/70">{job.company}</p>
      <h3 className="mt-1 text-2xl font-black leading-tight text-ink group-hover:underline md:text-[1.65rem]">
        {job.title}
      </h3>

      {job.description.trim() ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/80">{job.description.trim()}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold uppercase tracking-widest">
        <span className="inline-flex items-center gap-1 border-[2px] border-ink bg-pale px-2 py-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {locationLabel(job)}
        </span>
        <span className="border-[2px] border-ink bg-pale px-2 py-1">{job.employmentType}</span>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t-[3px] border-ink pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink/60">Compensation</p>
          <p className="text-lg font-black leading-tight">
            {salary ?? "Salary not specified"}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink/50">
            {formatDate(job.postedAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 border-[2px] border-ink bg-electric px-2 py-1 text-xs font-extrabold uppercase tracking-widest group-hover:bg-cobalt group-hover:text-white">
          View job
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </Link>
    </div>
  );
}
