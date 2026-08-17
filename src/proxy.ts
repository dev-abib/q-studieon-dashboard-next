import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
];
const PUBLIC_PREFIXES = ["/page/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  // Root route redirect: send directly to /dashboard or /login
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPublicRoute) {
    // Only bounce signed-in users away from the login page, but allow them to
    // access public content, accept-invite, reset-password, and forgot-password.
    if (pathname === "/login" && isAuthenticated) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Allow through when the refresh cookie exists: the client-side axios
  // interceptor refreshes the access token on the next API call instead of
  // hard-redirecting to /login.
  if (!isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
