import { useQuery } from '@tanstack/react-query';
import { contactQueriesApi } from '@/services/contact-queries.api';
import { StaffMember } from '../types/contact-queries.types';

export const useStaffMembers = () => {
  return useQuery<StaffMember[], Error>({
    queryKey: ['contact-queries', 'staff-members'],
    queryFn: () => contactQueriesApi.getStaffMembers(),
    staleTime: 5 * 60 * 1000,
  });
};
