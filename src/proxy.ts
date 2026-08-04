import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/page/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (isPublicRoute) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Allow through when the refresh cookie exists: the client-side axios
  // interceptor refreshes the access token on the next API call instead of
  // hard-redirecting to /login.
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
