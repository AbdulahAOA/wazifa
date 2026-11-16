"use client";

import { useActionState, useState } from "react";
import { deleteJobAction, setJobStatusAction } from "@/app/actions/jobs";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { JobStatus } from "@/lib/types";

const initial: ActionState = {};

const actions: Record<JobStatus, { status: JobStatus; label: string; confirm?: string }[]> = {
  draft: [
    { status: "published", label: "Publish" },
    { status: "archived", label: "Archive", confirm: "Archive this draft?" },
  ],
  published: [
    { status: "draft", label: "Unpublish" },
    { status: "closed", label: "Close applications", confirm: "Stop new applications for this job?" },
    { status: "archived", label: "Archive", confirm: "Hide this job and keep its applications?" },
  ],
  closed: [
    { status: "published", label: "Reopen" },
    { status: "archived", label: "Archive", confirm: "Archive this closed job?" },
  ],
  archived: [{ status: "draft", label: "Restore to draft" }],
};

export function JobStatusActions({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [state, action] = useActionState(setJobStatusAction, initial);
  const [confirming, setConfirming] = useState<JobStatus | null>(null);
  const pending = actions[status].find((item) => item.status === confirming);

  return (
    <div className="grid gap-3">
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      {state.message ? <p className="border-[3px] border-ink bg-electric px-3 py-2 font-bold">{state.message}</p> : null}
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="jobId" value={jobId} />
        {actions[status].map((item) =>
          item.confirm ? (
            <Button key={item.status} type="button" variant="outline" onClick={() => setConfirming(item.status)}>
              {item.label}
            </Button>
          ) : (
            <SubmitButton key={item.status} name="status" value={item.status} variant="cobalt" pendingLabel="Saving…">
              {item.label}
            </SubmitButton>
          ),
        )}
      </form>
      {status === "draft" || status === "archived" ? <DeleteJob jobId={jobId} /> : null}
      {pending?.confirm ? (
        <form action={action} className="grid gap-3 border-[3px] border-ink bg-pale p-4">
          <input type="hidden" name="jobId" value={jobId} />
          <p className="font-bold">{pending.confirm}</p>
          <div className="flex gap-2">
            <SubmitButton name="status" value={pending.status} variant="coral" pendingLabel="Saving…">
              Confirm
            </SubmitButton>
            <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function DeleteJob({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deleteJobAction, initial);
  if (!open) {
    return (
      <Button type="button" variant="coral" onClick={() => setOpen(true)}>
        Delete
      </Button>
    );
  }
  return (
    <form action={action} className="grid gap-3 border-[3px] border-ink bg-white p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <p className="font-bold">Delete this job permanently? Jobs with applications cannot be deleted.</p>
      {state.error ? <p className="font-bold text-coral">{state.error}</p> : null}
      <div className="flex gap-2">
        <SubmitButton variant="coral" pendingLabel="Deleting…">
          Delete job
        </SubmitButton>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
