import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import { destroySession, userFromSession } from "@/lib/services/accounts";

function cookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: loadEnv().cookieSecure,
    path: "/",
    maxAge,
  };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions());
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", cookieOptions(0));
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const env = loadEnv();
  const db = await getDb();
  return userFromSession(db, token, env.sessionSecret);
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard");
  if (user.role !== "admin") redirect("/");
  return user;
}

export async function logout() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await destroySession(await getDb(), token, loadEnv().sessionSecret);
  }
  await clearSessionCookie();
}
