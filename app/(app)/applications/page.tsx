import { Suspense } from "react";
import { MyApplications } from "@/components/applications/my-applications";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { listCandidateApplications } from "@/lib/services/applications";

export const metadata = { title: "My applications" };

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8 border-[3px] border-ink bg-electric p-6">
        <p className="section-kicker">Candidate</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">MY APPLICATIONS.</h1>
        <p className="mt-3 max-w-2xl text-lg">One board for every submission. Status is loud on purpose: pending, review, accepted, or rejected.</p>
      </div>
      <div>
        <Suspense fallback={<div className="border-[3px] border-ink bg-white p-8 font-black">Loading your applications…</div>}>
          <ApplicationsContent />
        </Suspense>
      </div>
    </div>
  );
}

async function ApplicationsContent() {
  await liveRequest();
  const user = await requireUser();
  const applications = await listCandidateApplications(await getDb(), user.id);
  return (
    <MyApplications
      applications={applications.map((item) => ({
        id: item.id,
        jobId: item.jobId,
        jobTitle: item.jobTitle,
        company: item.company,
        submittedAt: item.submittedAt,
        status: item.status,
      }))}
    />
  );
}
