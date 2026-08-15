import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { ContactQueryStatus } from '../types/contact-queries.types';
import { triggerSystemNotification } from '@/features/chat/hooks/use-chat-socket';
import { toast } from 'sonner';

export const useUpdateQueryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ContactQueryStatus;
    }) => contactQueriesApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Inquiry status updated.');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    },
  });
};

export const useDeleteQuery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactQueriesApi.deleteQuery(id),
    onSuccess: (data) => {
      toast.success(data.message || 'Inquiry deleted.');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to delete inquiry.';
      toast.error(msg);
    },
  });
};
