"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial);
  return (
    <form action={action} className="grid w-full gap-4 border-[3px] border-ink bg-white p-6 hard-shadow">
      <h1 className="text-4xl font-black">NEW PASSWORD.</h1>
      <input type="hidden" name="token" value={token} />
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      <SubmitButton variant="cobalt" pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
