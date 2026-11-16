"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { reviewApplicationAction } from "@/app/actions/applications";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { nextStatuses } from "@/lib/services/transitions";
import type { ApplicationStatus } from "@/lib/types";

const initial: ActionState = {};

export function ReviewForm({
  applicationId,
  status,
  notes,
}: {
  applicationId: string;
  status: ApplicationStatus;
  notes: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(reviewApplicationAction, initial);
  const allowed = nextStatuses("admin", status).filter((item) => item !== "Withdrawn");

  return (
    <form action={action} className="grid gap-4 border-[3px] border-ink bg-white p-5">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="expected" value={status} />
      <div className="grid gap-2">
        <Label htmlFor="notes">Review notes</Label>
        <Textarea id="notes" name="notes" defaultValue={notes} placeholder="Signal, concerns, next step…" />
      </div>
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      {allowed.length === 0 ? (
        <p className="border-[3px] border-ink bg-pale px-3 py-2 font-bold">This status is final. No further decision is available.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {allowed.map((item) => (
            <SubmitButton key={item} name="status" value={item} variant={item === "Rejected" ? "coral" : "cobalt"} pendingLabel="Saving…">
              {item === "Under Review" ? "Mark under review" : item === "Pending" ? "Return to pending" : item}
            </SubmitButton>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/applications/${applicationId}`)}>
        Back
      </Button>
    </form>
  );
}
