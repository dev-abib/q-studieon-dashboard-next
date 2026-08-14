"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { toast } from "sonner";

export interface InternalNoteItem {
  id: string;
  targetType: string;
  targetId: string;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    isOwner: boolean;
    profilePictureURL: string | null;
  };
}

export function useInternalNotes(targetType: string, targetId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["internal-notes", targetType, targetId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await adminApi.getInternalNotes(targetType, targetId);
      return res?.data as InternalNoteItem[];
    },
    enabled: Boolean(targetType && targetId),
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) =>
      adminApi.createInternalNote({ targetType, targetId, content }),
    onSuccess: () => {
      toast.success("Internal note added");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add note");
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: (noteId: string) => adminApi.togglePinInternalNote(noteId),
    onSuccess: (data) => {
      toast.success(data.message || "Pin updated");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => adminApi.deleteInternalNote(noteId),
    onSuccess: (data) => {
      toast.success(data.message || "Note removed");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notes: query.data || [],
    isLoading: query.isLoading,
    createNote: createNoteMutation.mutate,
    isCreating: createNoteMutation.isPending,
    togglePin: togglePinMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
  };
}
