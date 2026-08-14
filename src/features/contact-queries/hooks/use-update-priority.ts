import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { ContactQueryPriority } from '../types/contact-queries.types';
import { toast } from 'sonner';

export const useUpdatePriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: ContactQueryPriority }) =>
      contactQueriesApi.updatePriority(id, priority),
    onSuccess: (data) => {
      toast.success(data.message || 'Priority updated successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || 'Failed to update priority. Please try again.';
      toast.error(message);
    },
  });
};
