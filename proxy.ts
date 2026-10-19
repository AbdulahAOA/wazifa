
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const url = request.nextUrl;
  const pathname = url.pathname;

  console.log("Host:", host);
  console.log("Pathname:", pathname);

  // Rule: Check if admin.wazifa.app, then enter the dashboard
  const isAdminHost = host.includes("admin.wazifa.app");

  if (isAdminHost && !pathname.startsWith("/dashboard")) {
    console.log("[IsAdminHost] Redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rule: Check if wazifa.app is trying to access /dashboard
  const isMainDomain =
    host === "wazifa.app" || host === "www.wazifa.app";

  if (isMainDomain && pathname.startsWith("/dashboard")) {
    console.log("[IsMainDomain] Redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|sw\\.js|favicon\\.ico).*)",
  ],
};
