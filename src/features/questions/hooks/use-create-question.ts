import { queryClient } from "@/providers/query-provider";
import { questionsApi } from "@/services/questions.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateQuestion = () => {
  return useMutation({
    mutationFn: questionsApi.createQuestion,
    onSuccess: async data => {
      toast.success(
        data?.message ?? "Question created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to create question",
      );
    },
  });
};
