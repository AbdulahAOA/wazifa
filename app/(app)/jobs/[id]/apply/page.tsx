import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplyForm } from "@/components/jobs/apply-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { getPublicJob } from "@/lib/services/jobs";
import type { Job, PublicUser } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export default function ApplyPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 font-black">Loading application…</div>}>
      <ApplyContent params={params} />
    </Suspense>
  );
}

async function ApplyContent({ params }: Props) {
  await liveRequest();
  const { id } = await params;
  let job: Job | null = null;
  let user: PublicUser | null = null;
  let failed = false;
  try {
    const db = await getDb();
    job = await getPublicJob(db, id);
    user = await getCurrentUser();
  } catch (error) {
    console.error("apply:database", error);
    failed = true;
  }
  if (failed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="border-[3px] border-ink bg-coral p-6 text-2xl font-black text-white">
          The application form could not be loaded. Try again in a moment.
        </p>
      </div>
    );
  }
  if (!job) notFound();
  const next = `/jobs/${job.id}/apply`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link href={`/jobs/${job.id}`} className="text-xs font-extrabold tracking-widest uppercase underline">← Back to role</Link>
      <div className="mt-6 border-[3px] border-ink bg-ink p-5 text-white">
        <p className="section-kicker text-electric">Application</p>
        <h1 className="mt-2 text-4xl font-black md:text-5xl">APPLY TO {job.title.toUpperCase()}.</h1>
        <p className="mt-2 text-lg text-white/80">{job.company} · {job.location}</p>
      </div>
      <div className="mt-6">
        {job.status !== "published" ? (
          <p className="border-[3px] border-ink bg-coral p-5 font-black text-white">This job is not accepting applications.</p>
        ) : user ? (
          <ApplyForm jobId={job.id} company={job.company} user={user} />
        ) : (
          <div className="border-[3px] border-ink bg-white p-6 hard-shadow">
            <p className="text-xl font-black">Sign in to apply.</p>
            <p className="mt-2">Applications are tied to your account so you can track the decision.</p>
            <div className="mt-5 flex gap-3">
              <Button variant="cobalt" asChild>
                <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/sign-up?next=${encodeURIComponent(next)}`}>Create account</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
