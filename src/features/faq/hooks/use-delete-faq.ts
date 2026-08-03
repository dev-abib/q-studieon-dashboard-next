import { queryClient } from "@/providers/query-provider";
import { faqApi } from "@/services/faq.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ApiError {
  response?: { data?: { message?: string } };
}

export const useDeleteFaq = () => {
  return useMutation({
    mutationFn: (id: string) => faqApi.deleteFaq(id),
    onSuccess: async data => {
      toast.success(data?.message ?? "FAQ deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as ApiError)?.response?.data?.message ?? "Failed to delete FAQ",
      );
    },
  });
};
