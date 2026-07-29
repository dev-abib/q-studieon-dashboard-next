import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/pages"];
const PUBLIC_PREFIXES = ["/page/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const accessToken = req.cookies.get("accessToken")?.value;

  if (isPublicRoute) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
