import { adminApi } from "@/services/admin-api";
import { useQuery } from "@tanstack/react-query";

type UseGetAllAdminProps = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
};

export function useGetAllAdmins({
  page,
  limit,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
}: UseGetAllAdminProps) {
  return useQuery({
    queryKey: ["allAdmins", page, limit, sortBy, sortOrder, search],
    queryFn: () =>
      adminApi.getAllAdmin({
        page,
        limit,
        sortBy,
        sortOrder,
        search,
      }),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
