import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { listCandidateApplications } from "@/lib/services/applications";
import { getPublicJob } from "@/lib/services/jobs";

type Props = { params: Promise<{ id: string }> };

export default function ApplySuccessPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-20 font-black">Checking your application…</div>}>
      <Success params={params} />
    </Suspense>
  );
}

async function Success({ params }: Props) {
  await liveRequest();
  const { id } = await params;
  const user = await requireUser();
  const db = await getDb();
  const job = await getPublicJob(db, id);
  if (!job) notFound();
  const applications = await listCandidateApplications(db, user.id);
  const application = applications.find((item) => item.jobId === job.id);
  if (!application) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 md:px-6">
      <div className="border-[3px] border-ink bg-electric p-8 hard-shadow">
        <p className="section-kicker">Submitted</p>
        <h1 className="mt-3 text-5xl font-black">YOU&apos;RE IN THE QUEUE.</h1>
        <p className="mt-4 text-lg">
          Application received for <span className="font-black">{job.title}</span> at {job.company}. Current status: {application.status}.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/applications/${application.id}`}>View application</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/jobs">Keep browsing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
