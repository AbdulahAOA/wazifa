"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import { revalidateMarketplace } from "@/lib/revalidate";
import { rateLimit } from "@/lib/auth/rate-limit";
import { changeApplicationStatus, deleteApplication, submitApplication } from "@/lib/services/applications";
import { MAX_RESUME_BYTES } from "@/lib/services/files";
import { parseApplicationInput } from "@/lib/validation";
import type { ActionState } from "@/app/actions/auth";
import type { ApplicationStatus } from "@/lib/types";

const statuses = new Set<ApplicationStatus>(["Pending", "Under Review", "Accepted", "Rejected", "Withdrawn"]);

function isRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

export async function submitApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in before applying." };
  if (!rateLimit(`apply:${user.id}`, 20, 60 * 60 * 1000).ok) {
    return { error: "Too many applications. Try again later." };
  }
  const parsed = parseApplicationInput({
    jobId: String(formData.get("jobId") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    coverLetter: String(formData.get("coverLetter") ?? ""),
    details: String(formData.get("details") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error };
  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) return { error: "Upload a resume file." };
  if (resume.size > MAX_RESUME_BYTES) return { error: "Resume must be 5MB or smaller." };
  try {
    const bytes = Buffer.from(await resume.arrayBuffer());
    const result = await submitApplication(await getDb(), user, parsed.data, {
      filename: resume.name,
      bytes,
      storageDir: loadEnv().uploadDir,
    });
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(result.data.jobId);
    redirect(`/jobs/${result.data.jobId}/apply/success`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("submitApplication", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function reviewApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "You do not have access to this action." };
  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  const expected = String(formData.get("expected") ?? "") as ApplicationStatus;
  if (!statuses.has(status) || !statuses.has(expected)) return { error: "Choose a valid status." };
  try {
    const result = await changeApplicationStatus(
      await getDb(),
      user,
      String(formData.get("applicationId") ?? ""),
      status,
      String(formData.get("notes") ?? ""),
      expected,
    );
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(result.data.jobId);
    redirect("/dashboard/applications");
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("reviewApplication", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function deleteApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "You do not have access to this action." };
  if (!rateLimit(`delete-application:${user.id}`, 30, 60 * 60 * 1000).ok) {
    return { error: "Too many attempts. Try again later." };
  }
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  if (!applicationId) return { error: "Missing application." };
  try {
    const result = await deleteApplication(await getDb(), user, applicationId, loadEnv().uploadDir);
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(result.data.jobId);
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("deleteApplication", error);
    return { error: "Something went wrong. Try again." };
  }
  redirect("/dashboard/applications");
}

export async function withdrawApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to withdraw an application." };
  const expected = String(formData.get("expected") ?? "") as ApplicationStatus;
  if (!statuses.has(expected)) return { error: "This application cannot be withdrawn." };
  try {
    const result = await changeApplicationStatus(
      await getDb(),
      user,
      String(formData.get("applicationId") ?? ""),
      "Withdrawn",
      "Withdrawn by candidate",
      expected,
    );
    if (!result.ok) return { error: result.error };
    revalidateMarketplace(result.data.jobId);
    redirect(`/applications/${result.data.id}?notice=withdrawn`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("withdrawApplication", error);
    return { error: "Something went wrong. Try again." };
  }
}
