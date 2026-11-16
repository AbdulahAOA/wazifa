"use client";

import { useActionState } from "react";
import { withdrawApplicationAction } from "@/app/actions/applications";
import type { ActionState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ApplicationStatus } from "@/lib/types";

const initial: ActionState = {};

export function WithdrawButton({ applicationId, expected }: { applicationId: string; expected: ApplicationStatus }) {
  const [state, action] = useActionState(withdrawApplicationAction, initial);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="expected" value={expected} />
      {state.error ? <p className="font-bold text-coral">{state.error}</p> : null}
      <SubmitButton variant="outline" pendingLabel="Withdrawing…">Withdraw application</SubmitButton>
    </form>
  );
}
