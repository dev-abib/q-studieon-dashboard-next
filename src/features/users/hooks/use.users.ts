import { userApi } from "@/services/users.api";
import { useQuery } from "@tanstack/react-query";

type UseGetAllUsersProps = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
};

export function useGetAllUsers({
  page,
  limit,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
}: UseGetAllUsersProps) {
  return useQuery({
    queryKey: ["allUsers", page, limit, sortBy, sortOrder, search],
    queryFn: () =>
      userApi.getAllUsers({
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
