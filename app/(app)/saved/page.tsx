import { Suspense } from "react";
import { SavedJobCard } from "@/components/jobs/saved-job-card";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { listSavedJobs } from "@/lib/services/jobs";

export const metadata = { title: "Saved jobs" };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <p className="section-kicker">Candidate</p>
      <h1 className="mt-2 text-5xl font-black">SAVED JOBS.</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="font-black">Loading saved jobs…</div>}>
          <SavedContent />
        </Suspense>
      </div>
    </div>
  );
}

async function SavedContent() {
  await liveRequest();
  const user = await requireUser();
  const jobs = await listSavedJobs(await getDb(), user.id);
  if (jobs.length === 0) {
    return <p className="border-[3px] border-ink bg-white p-6 font-bold">You have not saved a role yet.</p>;
  }
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {jobs.map((job) => (
        <SavedJobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
