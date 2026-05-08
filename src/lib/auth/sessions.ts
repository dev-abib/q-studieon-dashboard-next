"use server";
import { cookies } from "next/headers";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};


export async function getAccessToken() {
  return (await cookies()).get("accessToken")?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get("refreshToken")?.value;
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}
