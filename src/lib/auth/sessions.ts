"use server";
import { cookies } from "next/headers";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    ...COOKIE_OPTS,
    maxAge: 60 * 15,
  });

  cookieStore.set("refresh_token", refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAccessToken() {
  return (await cookies()).get("access_token")?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get("refresh_token")?.value;
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}
