// src/features/tasks/components/TaskDetailsModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useTaskDetails, useUpdateTask, useDeleteTask, useCreateComment } from "../hooks/use-tasks";
import { useChatStore } from "@/features/chat/store/use-chat-store";
import {
  X,
  Trash2,
  Calendar,
  User,
  TrendingUp,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
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
  const [justCommented, setJustCommented] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll discussion to bottom on initial load and when new comments arrive
  useEffect(() => {
    if (task?.comments && task.comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [task?.comments?.length]);

  const handleStatusChange = (status: TaskStatus) => {
    const progress = status === "COMPLETED" ? 100 : (task?.progress === 100 ? 50 : task?.progress);
    updateTask.mutate({ status, progress });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTask.mutate({ assigneeId });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask.mutate({ priority });
  };

  const handleProgressChange = (progress: number) => {
    const status = progress === 100 ? "COMPLETED" : (task?.status === "COMPLETED" ? "IN_PROGRESS" : task?.status);
    updateTask.mutate({ progress, status });
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
    if (!commentContent.trim() || createComment.isPending) return;

    const content = commentContent.trim();
    createComment.mutate(content, {
      onSuccess: () => {
        setCommentContent("");
        setJustCommented(true);
        setTimeout(() => setJustCommented(false), 3000);
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex items-center justify-center shadow-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl">
          <p className="text-sm text-red-500 font-semibold mb-4">Failed to load task details</p>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const priorityColors = {
    LOW: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    MEDIUM: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    HIGH: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/40",
    URGENT: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800/50 font-bold",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[850px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Created by</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {task.creator?.name ?? task.creator?.email ?? "Admin"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                title="Delete task"
              >
                {deleteTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body Split */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left Panel: Task Info, Lifecycle & Progress */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 min-h-0 custom-scrollbar">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {task.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>

            {/* Lifecycle Status Stepper */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status Lifecycle
              </h4>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "TODO", label: "To Do" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "REVIEW", label: "Under Review" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ] as { value: TaskStatus; label: string }[]).map((statusItem) => {
                  const isActive = task.status === statusItem.value;
                  let activeClasses = "";
                  switch (statusItem.value) {
                    case "TODO":
                      activeClasses = "bg-slate-200 dark:bg-slate-750 text-slate-800 dark:text-white border-slate-350 dark:border-slate-600 font-bold shadow-xs";
                      break;
                    case "IN_PROGRESS":
                      activeClasses = "bg-blue-600 text-white border-blue-700 shadow-md font-bold";
                      break;
                    case "REVIEW":
                      activeClasses = "bg-amber-600 text-white border-amber-700 shadow-md font-bold";
                      break;
                    case "COMPLETED":
                      activeClasses = "bg-emerald-600 text-white border-emerald-700 shadow-md font-bold";
                      break;
                    case "CANCELLED":
                      activeClasses = "bg-red-600 text-white border-red-700 shadow-md font-bold";
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
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {statusItem.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team member & Due Date */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Teammate & Timeline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
                    Assignee
                  </label>
                  <select
                    value={task.assigneeId}
                    disabled={!isAdmin}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
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
                    Priority Level
                  </label>
                  <select
                    value={task.priority}
                    disabled={!isAdmin}
                    onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Priority</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">
                    Due Date
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "No due date set"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Adjuster */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Task Progress
                </span>
                <span className="text-primary font-extrabold text-sm">{task.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    task.progress === 100 ? "bg-emerald-500" : "bg-primary"
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleProgressChange(val)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                      task.progress === val
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-850"
                    }`}
                  >
                    {val}% {val === 0 ? "(Start)" : val === 100 ? "(Done)" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Discussion / Comments Feed */}
          <div className="w-full md:w-[380px] flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 min-h-0">
            {/* Header info */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Discussion Thread
                </h3>
                <span className="h-5 px-2 bg-primary/10 text-primary rounded-full text-[10px] font-bold flex items-center justify-center">
                  {task.comments?.length ?? 0}
                </span>
              </div>
              {justCommented && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Sent
                </span>
              )}
            </div>

            {/* Scrollable Comments List with Full Overflow-Y */}
            <div
              ref={commentsContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 custom-scrollbar overscroll-contain"
            >
              {!task.comments || task.comments.length === 0 ? (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                  <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <MessageSquare className="h-5 w-5 opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No comments yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Post an update or question below to notify the team.</p>
                  </div>
                </div>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {comment.author?.profilePictureURL ? (
                      <img
                        src={comment.author.profilePictureURL}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ring-1 ring-primary/20">
                        {comment.author?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 bg-white dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate text-[11px]">
                          {comment.author?.name ?? "Teammate"}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0 font-medium">
                          {new Date(comment.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words text-[11px]">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input Form */}
            <form
              onSubmit={handleAddComment}
              className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-2"
            >
              <input
                type="text"
                placeholder="Write a comment / discussion update..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-450 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={!commentContent.trim() || createComment.isPending}
                className="px-3.5 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 shrink-0 flex items-center justify-center gap-1 font-semibold text-xs active:scale-95"
              >
                {createComment.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Post</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
