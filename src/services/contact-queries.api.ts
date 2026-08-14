import api from './api-client';
import {
  ContactQuery,
  ContactQueriesResponse,
  ContactQueryStats,
  GetAllContactQueriesParams,
  ReplyContactQueryPayload,
  AssignContactQueryPayload,
  BulkActionPayload,
  StaffMember,
  ContactQueryStatus,
  ContactQueryPriority,
} from '@/features/contact-queries/types/contact-queries.types';

export const contactQueriesApi = {
  // Get all queries with pagination, search & filters
  getAllQueries: async (
    params?: GetAllContactQueriesParams,
  ): Promise<ContactQueriesResponse> => {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.search) cleanParams.search = params.search;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.priority && params.priority !== 'ALL') cleanParams.priority = params.priority;
    if (typeof params?.isRegisteredUser === 'boolean') {
      cleanParams.isRegisteredUser = params.isRegisteredUser;
    }
    if (params?.assignedToId && params.assignedToId !== 'ALL') {
      cleanParams.assignedToId = params.assignedToId;
    }
    if (params?.sortBy) cleanParams.sortBy = params.sortBy;
    if (params?.sortOrder) cleanParams.sortOrder = params.sortOrder;

    const res = await api.get<any>('/contact-query/all', {
      params: cleanParams,
    });
    const body = res.data;
    if (body && Array.isArray(body.data)) {
      return {
        data: body.data,
        meta: body.meta || {
          total: body.data.length,
          page: 1,
          limit: body.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return body;
  },

  // Get statistics
  getStats: async (): Promise<ContactQueryStats> => {
    const res = await api.get<any>('/contact-query/stats');
    if (res.data?.data && typeof res.data.data === 'object') {
      return res.data.data;
    }
    return res.data;
  },

  // Get staff members for case assignment
  getStaffMembers: async (): Promise<StaffMember[]> => {
    const res = await api.get<any>('/contact-query/staff-members');
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  },

  // Get query by ID
  getQueryById: async (id: string): Promise<ContactQuery> => {
    const res = await api.get<any>(`/contact-query/${id}`);
    return res.data?.data || res.data;
  },

  // Reply to inquiry
  replyToQuery: async (
    id: string,
    payload: ReplyContactQueryPayload,
  ): Promise<{ success: boolean; message: string; data: ContactQuery }> => {
    const res = await api.post(`/contact-query/${id}/reply`, payload);
    return res.data;
  },

  // Assign or transfer query to another staff member
  assignQuery: async (
    id: string,
    payload: AssignContactQueryPayload,
  ): Promise<{ success: boolean; message: string; data: ContactQuery }> => {
    const res = await api.post(`/contact-query/${id}/assign`, payload);
    return res.data;
  },

  // Update priority
  updatePriority: async (
    id: string,
    priority: ContactQueryPriority,
  ): Promise<{ success: boolean; message: string; data: ContactQuery }> => {
    const res = await api.patch(`/contact-query/${id}/priority`, { priority });
    return res.data;
  },

  // Add internal staff note
  addInternalNote: async (
    id: string,
    note: string,
  ): Promise<{ success: boolean; message: string; data: ContactQuery }> => {
    const res = await api.post(`/contact-query/${id}/notes`, { note });
    return res.data;
  },

  // Bulk actions on multiple inquiries
  bulkAction: async (
    payload: BulkActionPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/contact-query/bulk', payload);
    return res.data;
  },

  // Update status
  updateStatus: async (
    id: string,
    status: ContactQueryStatus,
  ): Promise<ContactQuery> => {
    const res = await api.patch(`/contact-query/${id}/status`, { status });
    return res.data;
  },

  // Delete query
  deleteQuery: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/contact-query/${id}`);
    return res.data;
  },

  // Toggle delete permission for staff member (Super Admin only)
  toggleDeletePermission: async (
    staffId: string,
    canDelete: boolean,
  ): Promise<{ success: boolean; message: string; data: StaffMember }> => {
    const res = await api.patch(`/contact-query/staff/${staffId}/delete-permission`, {
      canDelete,
    });
    return res.data;
  },

  // Toggle user details view permission for staff member (Super Admin only)
  toggleUserDetailsPermission: async (
    staffId: string,
    canViewUserDetails: boolean,
  ): Promise<{ success: boolean; message: string; data: StaffMember }> => {
    const res = await api.patch(`/contact-query/staff/${staffId}/user-details-permission`, {
      canViewUserDetails,
    });
    return res.data;
  },
};
