import { queryClient } from "@/providers/query-provider";
import { categoriesApi } from "@/services/categories.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUpdateCategory = () => {
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      categoriesApi.updateCategory(id, formData),
    onSuccess: async data => {
      toast.success(data?.message ?? "Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to update category",
      );
    },
  });
};
