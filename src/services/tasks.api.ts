import { api } from "./api-client";
import type { TaskAssignment, TaskComment, TaskStatus, TaskPriority } from "@/features/tasks/types/tasks.types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeId: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  progress?: number;
}

export const tasksApi = {
  getTasks: async (filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    creatorId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortField?: 'dueDate' | 'createdAt' | 'priority' | 'progress';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ tasks: TaskAssignment[]; total: number; page: number; limit: number }> => {
    const res = await api.get("/task-manager", { params: filters });
    return res.data?.data ?? res.data;
  },

  getTaskDetails: async (taskId: string): Promise<TaskAssignment> => {
    const res = await api.get(`/task-manager/${taskId}`);
    return res.data?.data ?? res.data;
  },

  createTask: async (payload: CreateTaskPayload): Promise<TaskAssignment> => {
    const res = await api.post("/task-manager", payload);
    return res.data?.data ?? res.data;
  },

  updateTask: async (
    taskId: string,
    payload: UpdateTaskPayload
  ): Promise<TaskAssignment> => {
    const res = await api.patch(`/task-manager/${taskId}`, payload);
    return res.data?.data ?? res.data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/task-manager/${taskId}`);
  },

  addComment: async (
    taskId: string,
    content: string
  ): Promise<TaskComment> => {
    const res = await api.post(`/task-manager/${taskId}/comments`, { content });
    return res.data?.data ?? res.data;
  },
};
