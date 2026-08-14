import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { toast } from 'sonner';

export const useToggleUserDetailsPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      canViewUserDetails,
    }: {
      staffId: string;
      canViewUserDetails: boolean;
    }) => contactQueriesApi.toggleUserDetailsPermission(staffId, canViewUserDetails),

    onSuccess: data => {
      toast.success(data.message || 'User details permission updated successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-queries', 'staff-members'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queries-stats'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },

    onError: (error: any) => {
      const msg =
        error.response?.data?.message || 'Failed to update user details viewing permission';
      toast.error(msg);
    },
  });
};
