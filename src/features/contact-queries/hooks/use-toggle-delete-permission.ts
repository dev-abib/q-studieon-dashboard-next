import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { toast } from 'sonner';

export const useToggleDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      canDelete,
    }: {
      staffId: string;
      canDelete: boolean;
    }) => contactQueriesApi.toggleDeletePermission(staffId, canDelete),
    onSuccess: (data) => {
      toast.success(data.message || 'Staff permission updated successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-queries', 'staff-members'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update staff deletion permission';
      toast.error(message);
    },
  });
};
