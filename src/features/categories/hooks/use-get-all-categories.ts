import { categoriesApi, GetAllCategoriesParams } from "@/services/categories.api";
import { useQuery } from "@tanstack/react-query";

export const useGetAllCategories = (params?: GetAllCategoriesParams) => {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesApi.getAllCategories(params),
  });
};
