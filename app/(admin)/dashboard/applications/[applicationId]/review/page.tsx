import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/admin/review-form";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { liveRequest } from "@/lib/live";
import { getApplicationForActor } from "@/lib/services/applications";

type Props = { params: Promise<{ applicationId: string }> };

export default function ApplicationReviewPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="font-black">Loading the review…</p>}>
      <ApplicationReview params={params} />
    </Suspense>
  );
}

async function ApplicationReview({ params }: Props) {
  await liveRequest();
  const user = await requireAdmin();
  const { applicationId } = await params;
  const application = await getApplicationForActor(await getDb(), user, applicationId);
  if (!application) notFound();

  return (
    <div className="grid gap-5">
      <div>
        <p className="section-kicker">Decision</p>
        <h1 className="text-4xl font-black">REVIEW {application.candidateName.toUpperCase()}.</h1>
        <p className="mt-1 font-bold">{application.jobTitle}</p>
      </div>
      <div className="border-[3px] border-ink bg-pale p-5 leading-7">{application.coverLetter}</div>
      <ReviewForm applicationId={application.id} status={application.status} notes={application.notes} />
    </div>
  );
}
