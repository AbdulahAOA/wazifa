"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import { revalidateMarketplace } from "@/lib/revalidate";
import { deactivateUserForAdmin, deleteUserForAdmin } from "@/lib/services/users";
import { adminUsersReturnPath } from "@/lib/admin-user-response";
import { safeNext } from "@/lib/validation";

function isRedirectError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT");
}

export async function deleteUserAction(formData: FormData) {
  const actor = await getCurrentUser();
  const returnTo = safeNext(String(formData.get("returnTo") ?? ""), "/dashboard/users");
  if (!actor || actor.role !== "admin") {
    redirect(adminUsersReturnPath(returnTo, "error", "You do not have access to delete users."));
  }
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) redirect(adminUsersReturnPath(returnTo, "error", "Missing user."));
  try {
    const result = await deleteUserForAdmin(await getDb(), actor, userId, loadEnv().uploadDir);
    if (!result.ok) redirect(adminUsersReturnPath(returnTo, "error", result.error));
    revalidateMarketplace();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("deleteUser", error);
    redirect(adminUsersReturnPath(returnTo, "error", "Something went wrong. Try again."));
  }
  redirect(adminUsersReturnPath(returnTo, "notice", "User permanently deleted."));
}

export async function deactivateUserAction(formData: FormData) {
  const actor = await getCurrentUser();
  const returnTo = safeNext(String(formData.get("returnTo") ?? ""), "/dashboard/users");
  if (!actor || actor.role !== "admin") {
    redirect(adminUsersReturnPath(returnTo, "error", "You do not have access to deactivate users."));
  }
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) redirect(adminUsersReturnPath(returnTo, "error", "Missing user."));
  try {
    const result = await deactivateUserForAdmin(await getDb(), actor, userId);
    if (!result.ok) redirect(adminUsersReturnPath(returnTo, "error", result.error));
    revalidateMarketplace();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("deactivateUser", error);
    redirect(adminUsersReturnPath(returnTo, "error", "Something went wrong. Try again."));
  }
  redirect(adminUsersReturnPath(returnTo, "notice", "Account deactivated. The user was not deleted."));
}
