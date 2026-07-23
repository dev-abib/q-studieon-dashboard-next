import { queryClient } from "@/providers/query-provider";
import { insightsApi } from "@/services/insights.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUpdateInsight = () => {
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      insightsApi.updateInsight(id, formData),
    onSuccess: async data => {
      toast.success(data?.message ?? "Insight updated successfully");
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to update insight",
      );
    },
  });
};
