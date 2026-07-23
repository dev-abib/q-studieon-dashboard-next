import { queryClient } from "@/providers/query-provider";
import { insightsApi } from "@/services/insights.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateInsight = () => {
  return useMutation({
    mutationFn: (formData: FormData) => insightsApi.createInsight(formData),
    onSuccess: async data => {
      toast.success(data?.message ?? "Insight created successfully");
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to create insight",
      );
    },
  });
};
