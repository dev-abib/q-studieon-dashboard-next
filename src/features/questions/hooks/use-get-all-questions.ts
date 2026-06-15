import { questionsApi, GetAllQuestionsParams } from "@/services/questions.api";
import { useQuery } from "@tanstack/react-query";

export const useGetAllQuestions = (params?: GetAllQuestionsParams) => {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => questionsApi.getAllQuestions(params),
  });
};
