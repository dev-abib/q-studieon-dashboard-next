import { useQuery } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { GetAllContactQueriesParams } from '../types/contact-queries.types';

export const useGetAllQueries = (params?: GetAllContactQueriesParams) => {
  return useQuery({
    queryKey: ['contact-queries', params],
    queryFn: () => contactQueriesApi.getAllQueries(params),
  });
};
