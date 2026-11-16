"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/account";
import type { ActionState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { PublicUser } from "@/lib/types";

const initial: ActionState = {};
const EXPERIENCE_SLOTS = 3;
const EDUCATION_SLOTS = 2;

export function ProfileForm({ user }: { user: PublicUser }) {
  const [state, action] = useActionState(updateProfileAction, initial);
  const experience = [...user.experience];
  while (experience.length < EXPERIENCE_SLOTS) {
    experience.push({ title: "", company: "", period: "", summary: "" });
  }
  const education = [...user.education];
  while (education.length < EDUCATION_SLOTS) {
    education.push({ school: "", degree: "", year: "" });
  }

  return (
    <form action={action} className="grid gap-6 border-[3px] border-ink bg-white p-5">
      {state.error ? <p className="border-[3px] border-ink bg-coral px-3 py-2 font-bold text-white">{state.error}</p> : null}
      {state.message ? <p className="border-[3px] border-ink bg-electric px-3 py-2 font-bold">{state.message}</p> : null}

      <div className="flex flex-wrap items-start gap-4 border-[3px] border-ink bg-pale p-4">
        <div className="size-24 shrink-0 overflow-hidden border-[3px] border-ink bg-white">
          {user.avatarFileId ? (
            // eslint-disable-next-line @next/next/no-img-element -- private authenticated file route
            <img src={`/api/files/${user.avatarFileId}`} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs font-black uppercase">Photo</div>
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <Label htmlFor="avatar">Profile photo</Label>
          <Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />
          <p className="text-xs font-bold text-ink/70">JPG, PNG, or WebP · 2MB max</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={user.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} readOnly />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={user.phone} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={user.location} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="headline">Professional headline</Label>
        <Input id="headline" name="headline" defaultValue={user.headline} placeholder="Senior product designer, Cairo" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Professional summary</Label>
        <Textarea id="bio" name="bio" defaultValue={user.bio} rows={5} placeholder="A short summary recruiters will see on applications." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="skills">Skills</Label>
        <Textarea
          id="skills"
          name="skills"
          defaultValue={user.skills.join("\n")}
          rows={4}
          placeholder="One skill per line (TypeScript, Product strategy, Arabic copy…)"
        />
      </div>

      <section className="grid gap-4 border-[3px] border-ink bg-pale p-4">
        <h2 className="text-xl font-black">Experience</h2>
        {experience.slice(0, EXPERIENCE_SLOTS).map((entry, index) => (
          <div key={index} className="grid gap-3 border-[2px] border-ink bg-white p-3">
            <p className="text-xs font-extrabold uppercase tracking-widest">Role {index + 1}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`experience_title_${index}`}>Title</Label>
                <Input id={`experience_title_${index}`} name={`experience_title_${index}`} defaultValue={entry.title} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`experience_company_${index}`}>Company</Label>
                <Input id={`experience_company_${index}`} name={`experience_company_${index}`} defaultValue={entry.company} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`experience_period_${index}`}>Period</Label>
              <Input id={`experience_period_${index}`} name={`experience_period_${index}`} defaultValue={entry.period} placeholder="2022 – Present" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`experience_summary_${index}`}>Summary</Label>
              <Textarea id={`experience_summary_${index}`} name={`experience_summary_${index}`} defaultValue={entry.summary} rows={3} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 border-[3px] border-ink bg-pale p-4">
        <h2 className="text-xl font-black">Education</h2>
        {education.slice(0, EDUCATION_SLOTS).map((entry, index) => (
          <div key={index} className="grid gap-3 border-[2px] border-ink bg-white p-3">
            <p className="text-xs font-extrabold uppercase tracking-widest">School {index + 1}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`education_school_${index}`}>School</Label>
                <Input id={`education_school_${index}`} name={`education_school_${index}`} defaultValue={entry.school} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`education_degree_${index}`}>Degree</Label>
                <Input id={`education_degree_${index}`} name={`education_degree_${index}`} defaultValue={entry.degree} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`education_year_${index}`}>Year</Label>
              <Input id={`education_year_${index}`} name={`education_year_${index}`} defaultValue={entry.year} placeholder="2020" />
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-2">
        <Label htmlFor="resume">Replace resume</Label>
        <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf" />
        {user.resumeFileId ? (
          <a className="text-sm font-extrabold uppercase underline" href={`/api/files/${user.resumeFileId}`}>
            Download current resume
          </a>
        ) : null}
      </div>
      <SubmitButton variant="cobalt" pendingLabel="Saving…">Save profile</SubmitButton>
    </form>
  );
}
