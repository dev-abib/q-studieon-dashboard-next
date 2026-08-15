import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { triggerSystemNotification } from '@/features/chat/hooks/use-chat-socket';
import { toast } from 'sonner';

export const useAddInternalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      contactQueriesApi.addInternalNote(id, note),
    onSuccess: (data) => {
      toast.success(data.message || 'Internal note saved');
      queryClient.invalidateQueries({ queryKey: ['contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || 'Failed to save internal note.';
      toast.error(message);
    },
  });
};
