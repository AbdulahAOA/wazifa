import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { formatDate } from "@/lib/format";
import { liveRequest } from "@/lib/live";
import { getApplicationForActor, listEvents } from "@/lib/services/applications";

type Props = { params: Promise<{ applicationId: string }> };

export default function ApplicationDetailsPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="font-black">Loading the application…</p>}>
      <ApplicationDetails params={params} />
    </Suspense>
  );
}

async function ApplicationDetails({ params }: Props) {
  await liveRequest();
  const user = await requireAdmin();
  const { applicationId } = await params;
  const application = await getApplicationForActor(await getDb(), user, applicationId);
  if (!application) notFound();
  const events = await listEvents(await getDb(), application.id);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker">Candidate</p>
          <h1 className="text-4xl font-black">{application.candidateName}</h1>
          <p className="mt-1 font-bold">{application.jobTitle}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Info label="Email" value={application.email} />
        <Info label="Phone" value={application.phone || "—"} />
        <Info label="Submitted" value={formatDate(application.submittedAt)} />
      </div>
      <div className="border-[3px] border-ink bg-white p-5">
        <p className="text-xs font-extrabold tracking-widest uppercase">Cover letter</p>
        <p className="mt-3 leading-7">{application.coverLetter}</p>
      </div>
      {application.details ? (
        <div className="border-[3px] border-ink bg-pale p-5">
          <p className="text-xs font-extrabold tracking-widest uppercase">Additional details</p>
          <p className="mt-3 leading-7">{application.details}</p>
        </div>
      ) : null}
      {application.notes ? (
        <div className="border-[3px] border-ink bg-white p-5">
          <p className="text-xs font-extrabold tracking-widest uppercase">Review notes</p>
          <p className="mt-3 leading-7">{application.notes}</p>
        </div>
      ) : null}
      <div className="border-[3px] border-ink bg-white p-5">
        <p className="text-xs font-extrabold tracking-widest uppercase">History</p>
        <ol className="mt-3 grid gap-2">
          {events.map((event) => (
            <li key={event.id} className="border-l-[6px] border-ink bg-pale px-3 py-2">
              <p className="text-xs font-extrabold uppercase">{formatDate(event.createdAt)} · {event.toStatus}</p>
              <p>{event.note}</p>
              <p className="text-sm font-bold">{event.actorName ?? "System"}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="cobalt" asChild>
          <Link href={`/dashboard/applications/${application.id}/review`}>Review</Link>
        </Button>
        {application.resumeFileId ? (
          <Button variant="outline" asChild>
            <a href={`/api/files/${application.resumeFileId}`}>Download resume</a>
          </Button>
        ) : (
          <p className="self-center text-sm font-bold">No resume on file.</p>
        )}
        <Button variant="outline" asChild>
          <Link href="/dashboard/applications">Back to queue</Link>
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[3px] border-ink bg-pale p-4">
      <p className="text-[10px] font-extrabold tracking-widest uppercase">{label}</p>
      <p className="font-black">{value}</p>
    </div>
  );
}
