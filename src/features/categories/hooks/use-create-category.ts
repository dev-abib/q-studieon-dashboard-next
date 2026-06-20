import { queryClient } from "@/providers/query-provider";
import { categoriesApi } from "@/services/categories.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateCategory = () => {
  return useMutation({
    mutationFn: (formData: FormData) => categoriesApi.createCategory(formData),
    onSuccess: async data => {
      toast.success(data?.message ?? "Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Failed to create category",
      );
    },
  });
};
