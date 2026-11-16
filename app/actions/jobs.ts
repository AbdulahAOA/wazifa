"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { revalidateMarketplace } from "@/lib/revalidate";
import { createJob, deleteJob, setJobStatus, toggleSavedJob, updateJob } from "@/lib/services/jobs";
import { formRecord, parseJobInput, parseJobStatus } from "@/lib/validation";
import type { ActionState } from "@/app/actions/auth";

async function adminOrError() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { user: null, error: "You do not have access to this action." as const };
  return { user, error: null };
}

export async function saveJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminOrError();
  if (!gate.user) return { error: gate.error };
  const parsed = parseJobInput(formRecord(formData));
  if (!parsed.ok) return { error: parsed.error };
  const jobId = String(formData.get("jobId") ?? "");
  try {
    const db = await getDb();
    const result = jobId
      ? await updateJob(db, gate.user, jobId, parsed.data)
      : await createJob(db, gate.user, parsed.data);
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(result.data.id);
    redirect("/dashboard/jobs");
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error && String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("saveJob", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function setJobStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminOrError();
  if (!gate.user) return { error: gate.error };
  const jobId = String(formData.get("jobId") ?? "");
  const status = parseJobStatus(String(formData.get("status") ?? ""));
  if (!status) return { error: "Choose a valid job status." };
  try {
    const result = await setJobStatus(await getDb(), gate.user, jobId, status);
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(result.data.id);
    return { message: `Job is now ${status}.` };
  } catch (error) {
    console.error("setJobStatus", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function deleteJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await adminOrError();
  if (!gate.user) return { error: gate.error };
  const jobId = String(formData.get("jobId") ?? "");
  try {
    const result = await deleteJob(await getDb(), gate.user, jobId);
    if (!result.ok) return { error: result.error };
    revalidateMarketplace();
  } catch (error) {
    console.error("deleteJob", error);
    return { error: "Something went wrong. Try again." };
  }
  redirect("/dashboard/jobs");
}

export async function toggleSavedJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save jobs." };
  const jobId = String(formData.get("jobId") ?? "");
  try {
    const result = await toggleSavedJob(await getDb(), user, jobId);
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(jobId);
    return { message: result.data.saved ? "Saved." : "Removed from saved jobs." };
  } catch (error) {
    console.error("toggleSaved", error);
    return { error: "Something went wrong. Try again." };
  }
}
