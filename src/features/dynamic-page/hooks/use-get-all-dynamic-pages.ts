import { dynamicPageApi, GetAllPagesParams } from "@/services/dynamic-page.api";
import { useQuery } from "@tanstack/react-query";

export const useGetAllPages = (params?: GetAllPagesParams) => {
  return useQuery({
    queryKey: ["dynamic-pages", params],
    queryFn: () => dynamicPageApi.getAllPages(params),
  });
};
