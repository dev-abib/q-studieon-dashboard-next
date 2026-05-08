// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  console.log(
    `[Proxy Middleware] ${pathname} | Access: ${!!accessToken} | Refresh: ${!!refreshToken}`,
  );

  // === Public Routes ===
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // === Protected Routes ===
  if (!accessToken) {
    if (refreshToken) {
      try {
        const res = await fetch(
          `${process.env.API_URL}/auth/admin/refresh-token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          },
        );

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        const response = NextResponse.next();

        response.cookies.set("accessToken", data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 15,
          path: "/",
        });

        response.cookies.set(
          "refreshToken",
          data.refreshToken || data.refresh_token,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
          },
        );

        return response;
      } catch (err) {
        console.error("Middleware refresh failed:", err);
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }

    // No tokens at all
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
