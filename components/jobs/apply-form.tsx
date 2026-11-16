"use client";

import { useActionState } from "react";
import { submitApplicationAction } from "@/app/actions/applications";
import type { ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { PublicUser } from "@/lib/types";

const initial: ActionState = {};

export function ApplyForm({ jobId, company, user }: { jobId: string; company: string; user: PublicUser }) {
  const [state, action] = useActionState(submitApplicationAction, initial);

  return (
    <form action={action} className="grid gap-5 border-[3px] border-ink bg-white p-5 hard-shadow">
      <input type="hidden" name="jobId" value={jobId} />
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={user.name} readOnly />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} readOnly />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={user.phone} placeholder="Optional" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="resume">Resume</Label>
        <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cover">Cover letter</Label>
        <Textarea id="cover" name="coverLetter" required minLength={40} placeholder={`Why ${company} and this role.`} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="details">Additional details</Label>
        <Textarea id="details" name="details" placeholder="Portfolio, notice period, work authorization…" />
      </div>
      <SubmitButton variant="cobalt" size="lg" pendingLabel="Submitting…">
        Submit application
      </SubmitButton>
    </form>
  );
}
