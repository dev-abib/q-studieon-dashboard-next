// src/features/chat/hooks/use-chat-groups.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/chat.api";
import { useChatStore } from "../store/use-chat-store";
import { useEffect } from "react";

export function useChatGroups() {
  const { setGroups } = useChatStore();

  const query = useQuery({
    queryKey: ["chat", "groups"],
    queryFn: chatApi.getGroups,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setGroups(query.data);
      const socket = useChatStore.getState().socket;
      if (socket && socket.connected) {
        query.data.forEach((g) => {
          socket.emit("joinGroup", { groupId: g.id });
        });
      }
    }
  }, [query.data, setGroups]);

  return query;
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createGroup,
    onSuccess: (newGroup) => {
      qc.invalidateQueries({ queryKey: ["chat", "groups"] });
      if (newGroup) {
        const { groups, setGroups } = useChatStore.getState();
        setGroups([newGroup, ...groups]);
      }
    },
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  const { setGroups } = useChatStore();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: any }) =>
      chatApi.updateGroup(groupId, payload),
    onSuccess: (updatedGroup) => {
      qc.invalidateQueries({ queryKey: ["chat", "groups"] });
      if (updatedGroup) {
        const { groups } = useChatStore.getState();
        setGroups(groups.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g)));
      }
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => chatApi.leaveGroup(groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "groups"] }),
  });
}

export function useArchiveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => chatApi.archiveGroup(groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "groups"] }),
  });
}
