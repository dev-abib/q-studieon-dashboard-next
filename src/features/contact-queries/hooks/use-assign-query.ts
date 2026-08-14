import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { AssignContactQueryPayload } from '../types/contact-queries.types';
import { toast } from 'sonner';

export const useAssignQuery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignContactQueryPayload;
    }) => contactQueriesApi.assignQuery(id, payload),
    onSuccess: (data) => {
      toast.success(data.message || 'Case assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to assign inquiry case';
      toast.error(msg);
    },
  });
};
