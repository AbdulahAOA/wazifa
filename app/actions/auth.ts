"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/auth/rate-limit";
import { logout, setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import {
  authenticate,
  createSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "@/lib/services/accounts";
import { formRecord, normalizeEmail, parseCredentials, safeNext } from "@/lib/validation";

export type ActionState = {
  error?: string;
  message?: string;
};

const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, a one-time reset link was prepared. Email delivery is not configured here, so no message was sent.";

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
}

function caught(error: unknown, label: string): ActionState {
  console.error(label, error);
  return { error: "Something went wrong. Try again." };
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const record = formRecord(formData);
  const parsed = parseCredentials(record, "sign-in");
  if (!parsed.ok) return { error: parsed.error };
  if (!rateLimit(`login:${await clientIp()}:${parsed.data.email}`, 10, 15 * 60 * 1000).ok) {
    return { error: "Too many attempts. Try again later." };
  }
  let result;
  try {
    result = await authenticate(await getDb(), parsed.data.email, parsed.data.password, loadEnv().sessionSecret);
  } catch (error) {
    return caught(error, "signIn");
  }
  if (!result.ok) return { error: result.error };
  await setSessionCookie(result.data.token);
  const fallback = result.data.user.role === "admin" ? "/dashboard" : "/applications";
  const next = safeNext(record.next, fallback);
  redirect(result.data.user.role === "admin" || !next.startsWith("/dashboard") ? next : "/applications");
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const record = formRecord(formData);
  const parsed = parseCredentials(record, "sign-up");
  if (!parsed.ok) return { error: parsed.error };
  if (!rateLimit(`register:${await clientIp()}`, 8, 60 * 60 * 1000).ok) {
    return { error: "Too many attempts. Try again later." };
  }
  try {
    const db = await getDb();
    const created = await registerUser(db, parsed.data);
    if (!created.ok) return { error: created.error };
    const token = await createSession(db, created.data.id, loadEnv().sessionSecret);
    await setSessionCookie(token);
  } catch (error) {
    return caught(error, "signUp");
  }
  const next = safeNext(record.next, "/applications");
  redirect(next.startsWith("/dashboard") ? "/applications" : next);
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (!rateLimit(`forgot:${await clientIp()}`, 5, 60 * 60 * 1000).ok) {
    return { error: "Too many attempts. Try again later." };
  }
  const env = loadEnv();
  try {
    await requestPasswordReset(await getDb(), email, env.sessionSecret, false);
  } catch (error) {
    return caught(error, "forgotPassword");
  }
  return { message: FORGOT_PASSWORD_MESSAGE };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!token) return { error: "This reset link is invalid or has expired." };
  if (!rateLimit(`reset:${await clientIp()}`, 10, 60 * 60 * 1000).ok) {
    return { error: "Too many attempts. Try again later." };
  }
  let result;
  try {
    result = await resetPassword(await getDb(), token, password, loadEnv().sessionSecret);
  } catch (error) {
    return caught(error, "resetPassword");
  }
  if (!result.ok) return { error: result.error };
  redirect("/sign-in?reset=1");
}

export async function signOutAction() {
  await logout();
  redirect("/");
}
