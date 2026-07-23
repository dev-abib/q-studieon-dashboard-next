import { insightsApi, GetAllInsightsParams } from "@/services/insights.api";
import { useQuery } from "@tanstack/react-query";

export const useGetAllInsights = (params?: GetAllInsightsParams) => {
  return useQuery({
    queryKey: ["insights", params],
    queryFn: () => insightsApi.getAllInsights(params),
  });
};
