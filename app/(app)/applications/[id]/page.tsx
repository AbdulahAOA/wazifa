import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WithdrawButton } from "@/components/applications/withdraw-button";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { first } from "@/lib/query";
import { getApplicationForActor, listEvents } from "@/lib/services/applications";
import { nextStatuses } from "@/lib/services/transitions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function ApplicationDetailPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 font-black">Loading application…</div>}>
      <Detail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Detail({ params, searchParams }: Props) {
  await liveRequest();
  const [{ id }, query, user] = await Promise.all([params, searchParams, requireUser()]);
  const db = await getDb();
  const application = await getApplicationForActor(db, user, id);
  if (!application || application.candidateUserId !== user.id) notFound();
  const events = await listEvents(db, application.id);
  const canWithdraw = nextStatuses(user.role, application.status).includes("Withdrawn");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link href="/applications" className="text-xs font-extrabold tracking-widest uppercase underline">← All applications</Link>
      {first(query.notice) === "withdrawn" ? (
        <p className="mt-4 border-[3px] border-ink bg-electric px-3 py-2 font-bold">Application withdrawn.</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-black">{application.jobTitle}</h1>
          <p className="mt-1 text-lg font-bold">{application.company}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className="mt-8 grid gap-4 border-[3px] border-ink bg-white p-5">
        <Row label="Submitted" value={formatDate(application.submittedAt)} />
        <Row label="Candidate" value={application.candidateName} />
        <Row label="Email" value={application.email} />
        <Row label="Phone" value={application.phone || "—"} />
      </div>
      <div className="mt-6 border-[3px] border-ink bg-pale p-5">
        <p className="text-xs font-extrabold tracking-widest uppercase">Cover letter</p>
        <p className="mt-3 leading-7">{application.coverLetter}</p>
      </div>
      {application.details ? (
        <div className="mt-6 border-[3px] border-ink bg-white p-5">
          <p className="text-xs font-extrabold tracking-widest uppercase">Additional details</p>
          <p className="mt-3 leading-7">{application.details}</p>
        </div>
      ) : null}
      <div className="mt-6">
        <p className="text-xs font-extrabold tracking-widest uppercase">Timeline</p>
        <ol className="mt-3 grid gap-2">
          {events.map((event) => (
            <li key={event.id} className="border-l-[6px] border-ink bg-white px-3 py-2">
              <p className="text-xs font-extrabold uppercase">{formatDate(event.createdAt)} · {event.toStatus}</p>
              <p>{event.note}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`/jobs/${application.jobId}`}>View job</Link>
        </Button>
        {application.resumeFileId ? (
          <Button variant="outline" asChild>
            <a href={`/api/files/${application.resumeFileId}`}>Download resume</a>
          </Button>
        ) : null}
      </div>
      {canWithdraw ? (
        <div className="mt-6 max-w-sm">
          <WithdrawButton applicationId={application.id} expected={application.status} />
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b-[2px] border-ink pb-3 last:border-b-0 last:pb-0">
      <p className="text-[10px] font-extrabold tracking-widest uppercase">{label}</p>
      <p className="font-black">{value}</p>
    </div>
  );
}
