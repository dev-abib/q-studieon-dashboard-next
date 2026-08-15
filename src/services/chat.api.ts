// src/services/chat.api.ts
import { api } from "./api-client";
import type { ChatGroup, ChatMessage, StaffSummary } from "@/features/chat/types/chat.types";

export const chatApi = {
  // ── Staff list for DM / mentions ─────────────────────────────────────────
  getStaff: async (): Promise<StaffSummary[]> => {
    const res = await api.get("/chat/staff");
    return res.data?.data ?? res.data;
  },

  // ── Groups ────────────────────────────────────────────────────────────────
  getGroups: async (): Promise<ChatGroup[]> => {
    const res = await api.get("/chat/groups");
    return res.data?.data ?? res.data;
  },

  createGroup: async (payload: {
    name: string;
    description?: string;
    avatarColor?: string;
    memberIds: string[];
  }): Promise<ChatGroup> => {
    const res = await api.post("/chat/groups", payload);
    return res.data?.data ?? res.data;
  },

  updateGroup: async (
    groupId: string,
    payload: {
      name?: string;
      description?: string;
      avatarColor?: string;
      memberIds?: string[];
    }
  ): Promise<ChatGroup> => {
    const res = await api.patch(`/chat/groups/${groupId}`, payload);
    return res.data?.data ?? res.data;
  },

  archiveGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/chat/groups/${groupId}`);
  },

  // ── Messages ──────────────────────────────────────────────────────────────
  getGroupMessages: async (
    groupId: string,
    cursor?: string
  ): Promise<ChatMessage[]> => {
    const res = await api.get(`/chat/groups/${groupId}/messages`, {
      params: cursor ? { cursor } : undefined,
    });
    return res.data?.data ?? res.data;
  },

  getDmMessages: async (
    partnerId: string,
    cursor?: string
  ): Promise<ChatMessage[]> => {
    const res = await api.get(`/chat/dms/${partnerId}/messages`, {
      params: cursor ? { cursor } : undefined,
    });
    return res.data?.data ?? res.data;
  },

  getDmThreads: async (): Promise<StaffSummary[]> => {
    const res = await api.get("/chat/dms");
    return res.data?.data ?? res.data;
  },

  // ── Unread ────────────────────────────────────────────────────────────────
  getUnread: async (): Promise<{ totalMentions: number }> => {
    const res = await api.get("/chat/unread");
    return res.data?.data ?? res.data;
  },

  // ── Surveillance ──────────────────────────────────────────────────────────
  getSurveillance: async (params?: {
    page?: number;
    search?: string;
    isFlagged?: boolean;
    isAutoFlagged?: boolean;
    senderId?: string;
  }) => {
    const res = await api.get("/chat/surveillance", { params });
    return res.data?.data ?? res.data;
  },

  flagMessage: async (messageId: string, reason: string) => {
    const res = await api.patch(`/chat/messages/${messageId}/flag`, { reason });
    return res.data?.data ?? res.data;
  },

  uploadAttachment: async (
    file: File
  ): Promise<{
    url: string;
    publicId: string;
    name: string;
    type: string;
    sizeBytes: number;
    mimeType: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/chat/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data?.data ?? res.data;
  },
};
