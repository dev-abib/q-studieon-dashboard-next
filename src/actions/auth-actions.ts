"use server";

import { setTokens, clearTokens } from "@/lib/auth/sessions";
import { redirect } from "next/navigation";

export async function saveTokensAction(
  accessToken: string,
  refreshToken: string,
) {
  await setTokens(accessToken, refreshToken);
}

export async function logoutAction() {
  await clearTokens();
  redirect("/login");
}
