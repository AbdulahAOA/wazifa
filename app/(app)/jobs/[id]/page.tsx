import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { JobCard } from "@/components/jobs/job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatDate, isNew } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { getPublicJob, isJobSaved, relatedJobs } from "@/lib/services/jobs";
import type { Job } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Job ${id.slice(0, 8)}` };
}

export default function JobDetailsPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 font-black">Loading role…</div>}>
      <JobDetails params={params} />
    </Suspense>
  );
}

async function JobDetails({ params }: Props) {
  await liveRequest();
  const { id } = await params;
  let job: Job | null = null;
  let related: Job[] = [];
  let user = null;
  let saved = false;
  let failed = false;
  try {
    const db = await getDb();
    job = await getPublicJob(db, id);
    if (job) {
      [related, user] = await Promise.all([relatedJobs(db, job), getCurrentUser()]);
      saved = user ? await isJobSaved(db, user.id, job.id) : false;
    }
  } catch (error) {
    console.error("job:database", error);
    failed = true;
  }
  if (failed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="border-[3px] border-ink bg-coral p-6 text-2xl font-black text-white">
          This role could not be loaded. Try again in a moment.
        </p>
      </div>
    );
  }
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            {job.featured ? <Badge tone="coral">Featured</Badge> : null}
            {job.remote ? <Badge tone="cobalt">Remote</Badge> : null}
            <Badge tone="pale">{job.employmentType}</Badge>
            {job.status === "closed" ? <Badge tone="coral">Closed</Badge> : null}
            {isNew(job.postedAt, Date.parse("2026-10-25T00:00:00.000Z")) ? <Badge tone="electric">New</Badge> : null}
          </div>
          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">{job.title}</h1>
          <p className="mt-3 text-xl font-extrabold">{job.company} · {job.location}</p>
          <div className="mt-8 border-[3px] border-ink bg-white p-6">
            <h2 className="text-2xl font-black">Description</h2>
            <p className="mt-3 leading-7">{job.description}</p>
            <Block title="Responsibilities" items={job.responsibilities} />
            <Block title="Requirements" items={job.requirements} />
            <div className="mt-8">
              <h2 className="text-2xl font-black">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} tone="electric">{skill}</Badge>
                ))}
              </div>
            </div>
            <Block title="Benefits" items={job.benefits} />
            <div className="mt-8 border-[3px] border-ink bg-electric p-4">
              <p className="text-xs font-extrabold tracking-widest uppercase">Salary</p>
              <p className="text-3xl font-black">{job.salary}</p>
            </div>
          </div>
        </div>
        <aside className="grid h-fit gap-4 lg:sticky lg:top-28">
          {job.status === "published" ? (
            <div className="border-[3px] border-ink bg-ink p-5 text-white">
              <p className="section-kicker text-electric">Apply</p>
              <p className="mt-2 text-2xl font-black">Send one complete application.</p>
              <Button variant="electric" size="lg" className="mt-5 w-full" asChild>
                <Link href={user ? `/jobs/${job.id}/apply` : `/sign-in?next=${encodeURIComponent(`/jobs/${job.id}/apply`)}`}>
                  Apply now
                </Link>
              </Button>
            </div>
          ) : (
            <p className="border-[3px] border-ink bg-coral p-4 font-black text-white">This role is closed to new applications.</p>
          )}
          {user && job.status === "published" ? <SaveJobButton jobId={job.id} saved={saved} /> : null}
          <div className="border-[3px] border-ink bg-pale p-5 hard-shadow">
            <Meta label="Location" value={job.location} />
            <Meta label="Employment" value={job.employmentType} />
            <Meta label="Experience" value={job.experienceLevel} />
            <Meta label="Published" value={formatDate(job.postedAt)} />
            <Meta label="Category" value={job.category} />
          </div>
        </aside>
      </div>
      {related.length > 0 ? (
        <section className="mt-12">
          <p className="section-kicker">Nearby</p>
          <h2 className="mt-2 text-3xl font-black">Related jobs</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <JobCard key={item.id} job={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-black">{title}</h2>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="border-l-[6px] border-ink bg-pale px-3 py-2">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b-[3px] border-ink py-3 last:border-b-0">
      <p className="text-[10px] font-extrabold tracking-widest uppercase">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}
