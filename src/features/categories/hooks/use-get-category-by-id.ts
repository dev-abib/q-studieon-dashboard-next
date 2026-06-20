import { categoriesApi } from "@/services/categories.api";
import { useQuery } from "@tanstack/react-query";

export const useGetCategoryById = (id: string) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesApi.getCategoryById(id),
    enabled: !!id,
  });
};
