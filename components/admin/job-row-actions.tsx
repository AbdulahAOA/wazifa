"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { deleteJobAction, setJobStatusAction } from "@/app/actions/jobs";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { JobStatus } from "@/lib/types";

const initial: ActionState = {};

export function JobRowActions({
  jobId,
  jobTitle,
  applicationCount,
  status,
}: {
  jobId: string;
  jobTitle: string;
  applicationCount: number;
  status: JobStatus;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleteState, deleteAction] = useActionState(deleteJobAction, initial);
  const [archiveState, archiveAction] = useActionState(setJobStatusAction, initial);

  const canDelete = applicationCount === 0;
  const canArchive = status !== "archived";

  if (!confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild className="shadow-[3px_3px_0_0_#111111]">
          <Link href={`/dashboard/jobs/${jobId}/edit`} aria-label={`Edit ${jobTitle}`}>
            Edit
          </Link>
        </Button>
        <Button
          type="button"
          variant="coral"
          size="sm"
          className="shadow-[3px_3px_0_0_#111111]"
          aria-label={`Delete ${jobTitle}`}
          onClick={() => setConfirming(true)}
        >
          Delete
        </Button>
      </div>
    );
  }

  return (
    <div
      className="grid min-w-[220px] gap-2 border-[3px] border-ink bg-pale p-3 shadow-[4px_4px_0_0_#111111]"
      role="dialog"
      aria-labelledby={`delete-job-${jobId}`}
      aria-modal="true"
    >
      <p id={`delete-job-${jobId}`} className="text-xs font-bold leading-snug">
        {canDelete
          ? `Delete “${jobTitle}” permanently? This cannot be undone.`
          : `This job has ${applicationCount} application(s). Delete is blocked to protect candidate records.`}
      </p>
      {deleteState.error ? (
        <p className="border-[2px] border-ink bg-coral px-2 py-1 text-xs font-bold text-white">{deleteState.error}</p>
      ) : null}
      {archiveState.error ? (
        <p className="border-[2px] border-ink bg-coral px-2 py-1 text-xs font-bold text-white">{archiveState.error}</p>
      ) : null}
      {archiveState.message ? (
        <p className="border-[2px] border-ink bg-electric px-2 py-1 text-xs font-bold">{archiveState.message}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canDelete ? (
          <form action={deleteAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <SubmitButton variant="coral" size="sm" pendingLabel="Deleting…" className="shadow-[3px_3px_0_0_#111111]">
              Confirm delete
            </SubmitButton>
          </form>
        ) : null}
        {!canDelete && canArchive ? (
          <form action={archiveAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="status" value="archived" />
            <SubmitButton variant="cobalt" size="sm" pendingLabel="Archiving…" className="shadow-[3px_3px_0_0_#111111]">
              Archive instead
            </SubmitButton>
          </form>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setConfirming(false);
            if (archiveState.message) router.refresh();
          }}
        >
          {archiveState.message ? "Close" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
