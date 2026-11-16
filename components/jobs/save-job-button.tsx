"use client";

import { Bookmark } from "lucide-react";
import { useActionState } from "react";
import { toggleSavedJobAction } from "@/app/actions/jobs";
import type { ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ActionState = {};

export function SaveJobButton({
  jobId,
  saved,
  compact = false,
}: {
  jobId: string;
  saved: boolean;
  compact?: boolean;
}) {
  const [state, action] = useActionState(toggleSavedJobAction, initial);
  const active = state.message?.includes("Saved") ? true : state.message?.includes("Removed") ? false : saved;
  return (
    <form action={action} className="grid gap-2" onClick={(event) => event.stopPropagation()}>
      <input type="hidden" name="jobId" value={jobId} />
      {compact ? (
        <SubmitButton
          variant={active ? "electric" : "outline"}
          size="icon"
          pendingLabel="…"
          aria-label={active ? "Unsave job" : "Save job"}
          className="bg-white"
        >
          <Bookmark className={active ? "fill-current" : undefined} />
        </SubmitButton>
      ) : (
        <SubmitButton variant={active ? "outline" : "electric"} pendingLabel="Saving…">
          {active ? "Unsave job" : "Save job"}
        </SubmitButton>
      )}
      {!compact && state.error ? <p className="text-sm font-bold text-coral">{state.error}</p> : null}
      {!compact && state.message ? <p className="text-sm font-bold">{state.message}</p> : null}
    </form>
  );
}
