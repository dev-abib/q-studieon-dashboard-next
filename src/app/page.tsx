import { getAccessToken, getRefreshToken } from "@/lib/auth/sessions";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const token = (await getAccessToken()) || (await getRefreshToken());
  redirect(token ? "/dashboard" : "/login");
}
