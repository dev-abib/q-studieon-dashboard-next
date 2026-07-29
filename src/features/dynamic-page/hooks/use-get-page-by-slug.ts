import { dynamicPageApi } from "@/services/dynamic-page.api";
import { useQuery } from "@tanstack/react-query";

export const useGetPageBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["dynamic-page", slug],
    queryFn: () => dynamicPageApi.getPageBySlug(slug),
    enabled: !!slug,
  });
};
