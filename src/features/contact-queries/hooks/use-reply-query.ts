import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { ReplyContactQueryPayload } from '../types/contact-queries.types';
import { toast } from 'sonner';

export const useReplyQuery = (queryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReplyContactQueryPayload) =>
      contactQueriesApi.replyToQuery(queryId, payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Reply sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contact-query', queryId] });
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Failed to deliver email reply. Please try again.';
      toast.error(msg);
    },
  });
};
