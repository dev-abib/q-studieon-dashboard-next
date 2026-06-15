import { questionsApi } from "@/services/questions.api";
import { useQuery } from "@tanstack/react-query";

export const useGetQuestionsBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["questions-by-slug", slug],
    queryFn: () => questionsApi.getQuestionsBySlug(slug),
    enabled: !!slug,
  });
};
