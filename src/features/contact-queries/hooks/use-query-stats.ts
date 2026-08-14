import { useQuery } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';

export const useQueryStats = () => {
  return useQuery({
    queryKey: ['contact-queries-stats'],
    queryFn: () => contactQueriesApi.getStats(),
  });
};
