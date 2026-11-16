import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "wazifa_session";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const pathname = request.nextUrl.pathname;

  const isAdminHost = host === "admin.wazifa.app" || host === "localhost" || host === "127.0.0.1";
  const isMainDomain = host === "wazifa.app" || host === "www.wazifa.app";
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isDashboard && isMainDomain) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isDashboard && !isAdminHost) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (host === "admin.wazifa.app" && !isDashboard && !pathname.startsWith("/api") && !pathname.startsWith("/sign-")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const needsSession =
    isDashboard ||
    pathname === "/applications" ||
    pathname.startsWith("/applications/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/saved" ||
    pathname.startsWith("/saved/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/");

  if (needsSession && !request.cookies.get(SESSION_COOKIE)?.value) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|sw\\.js|favicon\\.ico).*)"],
};
