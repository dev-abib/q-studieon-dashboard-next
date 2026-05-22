import { adminApi } from "@/services/admin-api";
import { useQuery } from "@tanstack/react-query";

export function useUserDetails(id: string) {
  return useQuery({
    queryKey: ["user-details", id],
    queryFn: () => adminApi.getUserDetails(id),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
