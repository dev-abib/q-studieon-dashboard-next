import { queryClient } from "@/providers/query-provider";
import { insightsApi } from "@/services/insights.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteInsight = () => {
  return useMutation({
    mutationFn: (id: string) => insightsApi.deleteInsight(id),
    onSuccess: async data => {
      toast.success(data?.message ?? "Insight deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to delete insight",
      );
    },
  });
};
