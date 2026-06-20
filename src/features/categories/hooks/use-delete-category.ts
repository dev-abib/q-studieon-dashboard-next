import { queryClient } from "@/providers/query-provider";
import { categoriesApi } from "@/services/categories.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteCategory = () => {
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: async data => {
      toast.success(data?.message ?? "Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: unknown) => {
      const err = error as any;
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 409) {
        toast.error(
          message ??
            "Cannot delete this category because it has questions linked to it. Remove or reassign them first.",
        );
      } else {
        toast.error(message ?? "Failed to delete category");
      }
    },
  });
};
