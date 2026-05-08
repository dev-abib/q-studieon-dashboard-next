"use server";

import { clearTokens } from "@/lib/auth/sessions";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await clearTokens();
  redirect("/login");
}
