import { queryClient } from "@/providers/query-provider";
import { dynamicPageApi } from "@/services/dynamic-page.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreatePage = () => {
  return useMutation({
    mutationFn: dynamicPageApi.createPage,
    onSuccess: async data => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["dynamic-pages"] });
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message);
    },
  });
};
