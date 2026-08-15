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
    if (query.data) setGroups(query.data);
  }, [query.data]);

  return query;
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "groups"] }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: any }) =>
      chatApi.updateGroup(groupId, payload),
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
