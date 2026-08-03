import { queryClient } from "@/providers/query-provider";
import { faqApi } from "@/services/faq.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ApiError {
  response?: { data?: { message?: string } };
}

export const useUpdateFaq = () => {
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      faqApi.updateFaq(id, formData),
    onSuccess: async data => {
      toast.success(data?.message ?? "FAQ updated successfully");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as ApiError)?.response?.data?.message ?? "Failed to update FAQ",
      );
    },
  });
};
