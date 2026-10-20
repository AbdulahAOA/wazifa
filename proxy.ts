
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];

  const pathname = request.nextUrl.pathname;

  // Production admin domain or localhost for testing
  const isAdminHost =
    host === "admin.wazifa.app" || host === "localhost";

  const isMainDomain =
    host === "wazifa.app" || host === "www.wazifa.app";

  const isDashboard =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  console.log("Host:", host);
  console.log("Pathname:", pathname);

  // Block dashboard on the main domain
  if (isDashboard && isMainDomain) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Block dashboard on any other host except admin and localhost
  if (isDashboard && !isAdminHost) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect admin domain to dashboard
  if (host === "admin.wazifa.app" && !isDashboard) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|sw\\.js|favicon\\.ico).*)",
  ],
};
