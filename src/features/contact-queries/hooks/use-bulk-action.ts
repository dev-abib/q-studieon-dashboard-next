import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { BulkActionPayload } from '../types/contact-queries.types';
import { toast } from 'sonner';

export const useBulkAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkActionPayload) =>
      contactQueriesApi.bulkAction(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Bulk operation completed');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || 'Failed to complete bulk action.';
      toast.error(message);
    },
  });
};
