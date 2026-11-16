"use client";

import { useActionState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveJobAction } from "@/app/actions/jobs";
import type { ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { Job } from "@/lib/types";

const initial: ActionState = {};

export function JobForm({
  job,
  categories,
}: {
  job?: Job;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, action] = useActionState(saveJobAction, initial);

  return (
    <form action={action} className="grid gap-5 border-[3px] border-ink bg-white p-5">
      {job ? <input type="hidden" name="jobId" value={job.id} /> : null}
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Job title">
          <Input name="title" defaultValue={job?.title ?? ""} required />
        </Field>
        <Field label="Company">
          <Input name="company" defaultValue={job?.company ?? ""} required />
        </Field>
        <Field label="Location">
          <Input name="location" defaultValue={job?.location ?? ""} required />
        </Field>
        <Field label="Salary label">
          <Input name="salaryLabel" defaultValue={job?.salary ?? ""} placeholder="$70k – $90k" />
        </Field>
        <Field label="Minimum salary">
          <Input name="salaryMin" type="number" min={0} defaultValue={job?.salaryMin ?? 0} required />
        </Field>
        <Field label="Maximum salary">
          <Input name="salaryMax" type="number" min={0} defaultValue={job?.salaryMax ?? ""} />
        </Field>
        <Field label="Category">
          <select name="categoryId" className="h-12 border-[3px] border-ink bg-white px-3 font-bold" defaultValue={job?.categoryId ?? categories[0]?.id}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Employment type">
          <select name="employmentType" className="h-12 border-[3px] border-ink bg-white px-3 font-bold" defaultValue={job?.employmentType ?? "Full-time"}>
            {["Full-time", "Part-time", "Contract", "Internship"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Experience">
          <select name="experienceLevel" className="h-12 border-[3px] border-ink bg-white px-3 font-bold" defaultValue={job?.experienceLevel ?? "Mid"}>
            {["Junior", "Mid", "Senior", "Lead"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-end gap-4 pb-3 text-xs font-extrabold tracking-widest uppercase">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="remote" value="true" defaultChecked={job?.remote ?? true} className="size-4 accent-ink" />
            Remote
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" value="true" defaultChecked={job?.featured ?? false} className="size-4 accent-ink" />
            Featured
          </label>
        </div>
      </div>
      <Field label="Description">
        <Textarea name="description" defaultValue={job?.description ?? ""} required />
      </Field>
      <Field label="Responsibilities (one per line)">
        <Textarea name="responsibilities" defaultValue={job?.responsibilities.join("\n") ?? ""} />
      </Field>
      <Field label="Requirements (one per line)">
        <Textarea name="requirements" defaultValue={job?.requirements.join("\n") ?? ""} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Skills (one per line)">
          <Textarea name="skills" defaultValue={job?.skills.join("\n") ?? ""} />
        </Field>
        <Field label="Benefits (one per line)">
          <Textarea name="benefits" defaultValue={job?.benefits.join("\n") ?? ""} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton name="intent" value="publish" variant="cobalt" pendingLabel="Saving…">
          {job ? "Update and publish" : "Publish job"}
        </SubmitButton>
        <SubmitButton name="intent" value="draft" variant="outline" pendingLabel="Saving…">
          Save draft
        </SubmitButton>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/jobs")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
