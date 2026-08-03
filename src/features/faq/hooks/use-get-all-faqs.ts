import { faqApi, GetAllFaqsParams } from "@/services/faq.api";
import { useQuery } from "@tanstack/react-query";

export const useGetAllFaqs = (params?: GetAllFaqsParams) => {
  return useQuery({
    queryKey: ["faqs", params],
    queryFn: () => faqApi.getAllFaqs(params),
  });
};
