import { queryClient } from "@/providers/query-provider";
import { dynamicPageApi } from "@/services/dynamic-page.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { UpdatePageInput } from "../types/update-page.types";


export const useUpdatePage = () => {
  return useMutation({
    mutationFn: ({
      slug,
      payload,
    }: {
      slug: string;
      payload: UpdatePageInput;
    }) => dynamicPageApi.updatePage(slug, payload),
    onSuccess: async data => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["dynamic-pages"] });
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message);
    },
  });
};
