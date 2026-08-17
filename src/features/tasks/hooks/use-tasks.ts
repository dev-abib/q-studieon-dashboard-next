"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/services/tasks.api";
import type { TaskStatus, TaskPriority } from "../types/tasks.types";

export function useTasks(filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  creatorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortField?: 'dueDate' | 'createdAt' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ["tasks", "list", filters],
    queryFn: () => tasksApi.getTasks(filters),
    staleTime: 10_000,
  });
}

export function useTaskDetails(taskId: string) {
  return useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: () => tasksApi.getTaskDetails(taskId),
    enabled: !!taskId,
    staleTime: 5_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
    },
  });
}

export function useUpdateTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => tasksApi.updateTask(taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
      qc.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
    },
  });
}

export function useUpdateTaskGeneric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: any }) =>
      tasksApi.updateTask(taskId, payload),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
      qc.invalidateQueries({ queryKey: ["tasks", "detail", variables.taskId] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
    },
  });
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => tasksApi.addComment(taskId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
    },
  });
}
