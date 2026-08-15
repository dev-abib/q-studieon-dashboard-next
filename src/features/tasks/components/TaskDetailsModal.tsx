"use client";

import { useState } from "react";
import { useTaskDetails, useUpdateTask, useDeleteTask, useCreateComment } from "../hooks/use-tasks";
import { useChatStore } from "@/features/chat/store/use-chat-store";
import { X, Trash2, Calendar, User, TrendingUp, Send, Loader2 } from "lucide-react";
import type { TaskStatus, TaskPriority } from "../types/tasks.types";

interface Props {
  taskId: string;
  userRole: string;
  isOwner?: boolean;
  onClose: () => void;
}

export function TaskDetailsModal({ taskId, userRole, isOwner, onClose }: Props) {
  const isAdmin = userRole === "admin" || userRole === "super_admin" || !!isOwner;
  const { staffList } = useChatStore();
  const { data: task, isLoading, error } = useTaskDetails(taskId);

  const updateTask = useUpdateTask(taskId);
  const deleteTask = useDeleteTask();
  const createComment = useCreateComment(taskId);

  const [commentContent, setCommentContent] = useState("");

  const handleStatusChange = (status: TaskStatus) => {
    updateTask.mutate({ status });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTask.mutate({ assigneeId });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask.mutate({ priority });
  };

  const handleProgressChange = (progress: number) => {
    updateTask.mutate({ progress });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(taskId, {
        onSuccess: () => onClose(),
      });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    createComment.mutate(commentContent, {
      onSuccess: () => setCommentContent(""),
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center max-w-sm">
          <p className="text-sm text-red-500 font-semibold mb-4">Failed to load task details</p>
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  const priorityColors = {
    LOW: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
    MEDIUM: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    HIGH: "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400",
    URGENT: "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${priorityColors[task.priority]}`}>
              {task.priority} Priority
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Created by {task.creator?.name ?? "Admin"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                title="Delete task"
              >
                {deleteTask.isPending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Content body split */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left panel: Info & progress */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {task.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status Progress Lifecycle
              </h4>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "TODO", label: "To Do" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "REVIEW", label: "Review" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ] as { value: TaskStatus; label: string }[]).map((statusItem) => {
                  const isActive = task.status === statusItem.value;
                  let activeClasses = "";
                  switch (statusItem.value) {
                    case "TODO":
                      activeClasses = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-350 dark:border-slate-700 font-bold";
                      break;
                    case "IN_PROGRESS":
                      activeClasses = "bg-blue-500 text-white border-blue-600 shadow-xs font-bold";
                      break;
                    case "REVIEW":
                      activeClasses = "bg-amber-500 text-white border-amber-600 shadow-xs font-bold";
                      break;
                    case "COMPLETED":
                      activeClasses = "bg-emerald-500 text-white border-emerald-600 shadow-xs font-bold";
                      break;
                    case "CANCELLED":
                      activeClasses = "bg-red-500 text-white border-red-600 shadow-xs font-bold";
                      break;
                  }

                  return (
                    <button
                      key={statusItem.value}
                      type="button"
                      onClick={() => handleStatusChange(statusItem.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                        isActive
                          ? activeClasses
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {statusItem.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Teammate & Timeline
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
                    Assignee
                  </label>
                  <select
                    value={task.assigneeId}
                    disabled={!isAdmin}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-75"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    disabled={!isAdmin}
                    onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-75"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
                    Due Date
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Selector */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Task Progress
                </span>
                <span className="text-primary font-bold text-sm">{task.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleProgressChange(val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      task.progress === val
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-805 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {val}% {val === 0 ? "(Reset)" : val === 100 ? "(Done)" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Discussion / Comments list */}
          <div className="w-[340px] flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
            {/* Header info */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Discussion ({task.comments?.length ?? 0})
              </span>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {!task.comments || task.comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                  <span className="text-lg">💬</span>
                  <p className="text-xs">No comments yet. Start the discussion!</p>
                </div>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 text-xs">
                    {comment.author?.profilePictureURL ? (
                      <img
                        src={comment.author.profilePictureURL}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">
                        {comment.author?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {comment.author?.name ?? "Teammate"}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {new Date(comment.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input form */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!commentContent.trim() || createComment.isPending}
                className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center"
              >
                {createComment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
