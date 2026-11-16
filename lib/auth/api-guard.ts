import type { PublicUser } from "@/lib/types";

/** Reject cross-site POSTs that include a foreign Origin (CSRF mitigation for cookie auth). */
export function rejectCrossSitePost(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("host");
  if (!host) return null;
  try {
    if (new URL(origin).host !== host) {
      return new Response("Forbidden", { status: 403 });
    }
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

export function rejectUnlessAdmin(actor: PublicUser | null): Response | null {
  if (!actor) return new Response("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return new Response("Forbidden", { status: 403 });
  return null;
}
