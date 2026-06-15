import { queryClient } from "@/providers/query-provider";
import { questionsApi } from "@/services/questions.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { UpdateQuestionInput } from "../types/update-question.types";

export const useUpdateQuestion = () => {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateQuestionInput;
    }) => questionsApi.updateQuestion(id, payload),
    onSuccess: async data => {
      toast.success(
        data?.message ?? "Question updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to update question",
      );
    },
  });
};
