"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import { revalidateMarketplace } from "@/lib/revalidate";
import { updateProfile } from "@/lib/services/accounts";
import { MAX_AVATAR_BYTES, MAX_RESUME_BYTES, storeAvatar, storeResume } from "@/lib/services/files";
import { createCategory, deleteCategory, saveSettings } from "@/lib/services/settings";
import { markAllRead, markNotificationRead } from "@/lib/services/notifications";
import { formRecord, parseProfileInput, safeNext } from "@/lib/validation";
import type { ActionState } from "@/app/actions/auth";

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to update your profile." };
  const parsed = parseProfileInput(formRecord(formData));
  if (!parsed.ok) return { error: parsed.error };
  const resume = formData.get("resume");
  const avatar = formData.get("avatar");
  let resumeFileId: string | undefined;
  let avatarFileId: string | undefined;
  try {
    const db = await getDb();
    const storageDir = loadEnv().uploadDir;
    if (resume instanceof File && resume.size > 0) {
      if (resume.size > MAX_RESUME_BYTES) return { error: "Resume must be 5MB or smaller." };
      const stored = await storeResume(db, {
        ownerUserId: user.id,
        filename: resume.name,
        bytes: Buffer.from(await resume.arrayBuffer()),
        storageDir,
      });
      if (!stored.ok) return { error: stored.error };
      resumeFileId = stored.data.id;
    }
    if (avatar instanceof File && avatar.size > 0) {
      if (avatar.size > MAX_AVATAR_BYTES) return { error: "Profile photo must be 2MB or smaller." };
      const stored = await storeAvatar(db, {
        ownerUserId: user.id,
        filename: avatar.name,
        bytes: Buffer.from(await avatar.arrayBuffer()),
        storageDir,
      });
      if (!stored.ok) return { error: stored.error };
      avatarFileId = stored.data.id;
    }
    const result = await updateProfile(db, user, parsed.data, { resumeFileId, avatarFileId });
    if (!result.ok) return { error: result.error };
    revalidateMarketplace();
    return { message: "Profile saved." };
  } catch (error) {
    console.error("updateProfile", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "You do not have access to settings." };
  try {
    const result = await saveSettings(await getDb(), user, {
      boardName: String(formData.get("boardName") ?? ""),
      publicDomain: String(formData.get("publicDomain") ?? ""),
      adminDomain: String(formData.get("adminDomain") ?? ""),
      showFeatured: formData.get("showFeatured") === "on",
    });
    if (!result.ok) return { error: result.error };
    revalidateMarketplace();
    return { message: "Settings saved." };
  } catch (error) {
    console.error("saveSettings", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "You do not have access to categories." };
  try {
    const result = await createCategory(await getDb(), user, String(formData.get("name") ?? ""));
    if (!result.ok) return { error: result.error };
    revalidateMarketplace();
    return { message: "Category added." };
  } catch (error) {
    console.error("createCategory", error);
    return { error: "Something went wrong. Try again." };
  }
}

export async function saveSettingsForm(formData: FormData) {
  const state = await saveSettingsAction({}, formData);
  redirect(`/dashboard/settings?${state.error ? `error=${encodeURIComponent(state.error)}` : "notice=Settings+saved"}`);
}

export async function createCategoryForm(formData: FormData) {
  const state = await createCategoryAction({}, formData);
  redirect(`/dashboard/settings?${state.error ? `error=${encodeURIComponent(state.error)}` : "notice=Category+added"}`);
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard/settings?error=forbidden");
  const result = await deleteCategory(await getDb(), user, String(formData.get("categoryId") ?? ""));
  revalidateMarketplace();
  redirect(`/dashboard/settings?${result.ok ? "notice=Category+removed" : `error=${encodeURIComponent(result.error)}`}`);
}

export async function openNotificationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const href = await markNotificationRead(await getDb(), user.id, String(formData.get("id") ?? ""));
  revalidateMarketplace();
  redirect(href ?? (user.role === "admin" ? "/dashboard/notifications" : "/notifications"));
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  await markAllRead(await getDb(), user.id);
  revalidateMarketplace();
  redirect(safeNext(user.role === "admin" ? "/dashboard/notifications" : "/notifications", "/notifications"));
}
