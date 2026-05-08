import { getAccessToken } from "@/lib/auth/sessions";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const token = await getAccessToken();
  redirect(token ? "/dashboard" : "/login");
}
