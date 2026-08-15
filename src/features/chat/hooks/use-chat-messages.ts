// src/features/chat/hooks/use-chat-messages.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/services/chat.api";
import { useChatStore } from "../store/use-chat-store";
import { useEffect } from "react";
import type { ActiveConversation } from "../types/chat.types";

export function useChatMessages(conversation: ActiveConversation | null) {
  const { prependMessages } = useChatStore();

  const groupQuery = useQuery({
    queryKey: ["chat", "messages", "group", conversation?.id],
    queryFn: () => chatApi.getGroupMessages(conversation!.id),
    enabled: conversation?.type === "group",
    staleTime: 0,
    gcTime: 0,
  });

  const dmQuery = useQuery({
    queryKey: ["chat", "messages", "dm", conversation?.id],
    queryFn: () => chatApi.getDmMessages(conversation!.id),
    enabled: conversation?.type === "dm",
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (!conversation) return;
    const key = `${conversation.type}:${conversation.id}`;
    const msgs = conversation.type === "group" ? groupQuery.data : dmQuery.data;
    if (msgs) {
      // Messages come back newest-first from the API; reverse for display
      prependMessages(key, [...msgs].reverse());
    }
  }, [groupQuery.data, dmQuery.data]);

  return conversation?.type === "group" ? groupQuery : dmQuery;
}

export function useStaffList() {
  const { setStaffList } = useChatStore();
  const query = useQuery({
    queryKey: ["chat", "staff"],
    queryFn: chatApi.getStaff,
    staleTime: 5 * 60_000,
  });
  useEffect(() => {
    if (query.data) setStaffList(query.data);
  }, [query.data]);
  return query;
}

export function useDmThreads() {
  const { setDmPartners } = useChatStore();
  const query = useQuery({
    queryKey: ["chat", "dms"],
    queryFn: chatApi.getDmThreads,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (query.data) setDmPartners(query.data);
  }, [query.data]);
  return query;
}

export function useUnreadCounts() {
  return useQuery({
    queryKey: ["chat", "unread"],
    queryFn: chatApi.getUnread,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
