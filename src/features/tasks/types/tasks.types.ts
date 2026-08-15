import type { StaffSummary } from "@/features/chat/types/chat.types";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskAssignment {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assignee: StaffSummary;
  creatorId: string;
  creator: { id: string; name: string | null; email: string | null };
  dueDate: string | null;
  completedAt: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  comments?: TaskComment[];
  _count?: {
    comments: number;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  author: StaffSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}
