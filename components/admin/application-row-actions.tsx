"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteApplicationAction } from "@/app/actions/applications";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ActionState = {};

export function ApplicationRowActions({
  applicationId,
  candidateName,
  jobTitle,
}: {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState(deleteApplicationAction, initial);

  if (!confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild className="shadow-[3px_3px_0_0_#111111]">
          <Link href={`/dashboard/applications/${applicationId}`} aria-label={`Review ${candidateName} for ${jobTitle}`}>
            Review
          </Link>
        </Button>
        <Button
          type="button"
          variant="coral"
          size="sm"
          className="shadow-[3px_3px_0_0_#111111]"
          aria-label={`Delete application from ${candidateName} for ${jobTitle}`}
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
      aria-labelledby={`delete-application-${applicationId}`}
      aria-modal="true"
    >
      <p id={`delete-application-${applicationId}`} className="text-xs font-bold leading-snug">
        Delete {candidateName}&apos;s application for {jobTitle}? The candidate account and job stay in the system.
        Application history for this row is removed; an audit entry is kept.
      </p>
      {state.error ? (
        <p className="border-[2px] border-ink bg-coral px-2 py-1 text-xs font-bold text-white">{state.error}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <SubmitButton variant="coral" size="sm" pendingLabel="Deleting…" className="shadow-[3px_3px_0_0_#111111]">
            Confirm delete
          </SubmitButton>
        </form>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
