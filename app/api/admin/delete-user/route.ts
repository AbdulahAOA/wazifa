import { NextResponse } from "next/server";
import { rejectCrossSitePost, rejectUnlessAdmin } from "@/lib/auth/api-guard";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import { revalidateMarketplace } from "@/lib/revalidate";
import { deleteUserForAdmin } from "@/lib/services/users";
import { adminUsersReturnPath } from "@/lib/admin-user-response";
import { safeNext } from "@/lib/validation";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  const blocked = rejectCrossSitePost(request);
  if (blocked) return blocked;
  const actor = await getCurrentUser();
  const authError = rejectUnlessAdmin(actor);
  const formData = await request.formData();
  const returnTo = safeNext(String(formData.get("returnTo") ?? ""), "/dashboard/users");
  if (authError) {
    return authError;
  }
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return redirectTo(request, adminUsersReturnPath(returnTo, "error", "Missing user."));
  try {
    const result = await deleteUserForAdmin(await getDb(), actor!, userId, loadEnv().uploadDir);
    if (!result.ok) return redirectTo(request, adminUsersReturnPath(returnTo, "error", result.error));
    revalidateMarketplace();
  } catch (error) {
    console.error("delete-user route", error);
    return redirectTo(request, adminUsersReturnPath(returnTo, "error", "Something went wrong. Try again."));
  }
  return redirectTo(request, adminUsersReturnPath(returnTo, "notice", "User permanently deleted."));
}
