export async function refreshAccessToken(refreshToken: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  const res = await fetch(`${apiUrl}/auth/admin/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const data = await res.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}
