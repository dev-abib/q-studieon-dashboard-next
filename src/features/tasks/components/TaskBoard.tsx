// src/features/tasks/components/TaskBoard.tsx
"use client";

import { useState } from "react";
import { useTasks, useUpdateTaskGeneric } from "../hooks/use-tasks";
import { useChatStore } from "@/features/chat/store/use-chat-store";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskList } from "./TaskList";
import {
  Plus,
  Search,
  Calendar,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  LayoutGrid,
  List,
  CheckCircle2,
  GripVertical,
  X,
  User,
  Clock,
  Sparkles,
} from "lucide-react";
import type { TaskStatus, TaskPriority, TaskAssignment } from "../types/tasks.types";

interface Props {
  currentUserId: string;
  userRole: string;
  isOwner?: boolean;
}

export function TaskBoard({ currentUserId, userRole, isOwner }: Props) {
  const isAdmin = userRole === "admin" || userRole === "super_admin" || !!isOwner;
  const { staffList } = useChatStore();

  const [search, setSearch] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [viewType, setViewType] = useState<"board" | "list">("board");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<"dueDate" | "createdAt" | "priority" | "progress">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const filters = {
    search: search || undefined,
    assigneeId: myTasksOnly ? currentUserId : (selectedAssignee || undefined),
    priority: (selectedPriority as TaskPriority) || undefined,
    page,
    limit: viewType === "list" ? 10 : 100,
    sortField,
    sortOrder,
  };

  const { data, isLoading, refetch, isFetching } = useTasks(filters);
  const tasks = data?.tasks ?? [];
  const total = data?.total ?? 0;

  const updateTask = useUpdateTaskGeneric();

  // Quick move to next status
  const handleQuickMove = (taskId: string, currentStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: TaskStatus | null = null;
    let nextProgress: number | undefined = undefined;

    if (currentStatus === "TODO") {
      nextStatus = "IN_PROGRESS";
      nextProgress = 25;
    } else if (currentStatus === "IN_PROGRESS") {
      nextStatus = "REVIEW";
      nextProgress = 75;
    } else if (currentStatus === "REVIEW") {
      nextStatus = "COMPLETED";
      nextProgress = 100;
    }

    if (nextStatus) {
      updateTask.mutate({
        taskId,
        payload: {
          status: nextStatus,
          ...(nextProgress !== undefined ? { progress: nextProgress } : {}),
        },
      });
    }
  };

  // Quick progress increment
  const handleIncrementProgress = (task: TaskAssignment, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = task.progress || 0;
    const next = Math.min(100, current + 25);
    const newStatus = next === 100 ? "COMPLETED" : task.status === "TODO" ? "IN_PROGRESS" : task.status;
    updateTask.mutate({
      taskId: task.id,
      payload: { progress: next, status: newStatus },
    });
  };

  // Drag & drop drop handler
  const handleDropOnColumn = (targetStatus: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDragOverCol(null);
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    let newProgress = task.progress;
    if (targetStatus === "COMPLETED") {
      newProgress = 100;
    } else if (task.status === "COMPLETED" && newProgress === 100) {
      newProgress = targetStatus === "REVIEW" ? 75 : targetStatus === "IN_PROGRESS" ? 50 : 0;
    }

    updateTask.mutate({
      taskId,
      payload: {
        status: targetStatus,
        progress: newProgress,
      },
    });
  };

  // Column definitions with vibrant theme accents
  const columns: {
    label: string;
    status: TaskStatus;
    bg: string;
    border: string;
    headerBg: string;
    dotColor: string;
    textColor: string;
  }[] = [
    {
      label: "To Do",
      status: "TODO",
      bg: "bg-slate-100/60 dark:bg-slate-900/40",
      border: "border-slate-200/80 dark:border-slate-800",
      headerBg: "bg-slate-200/50 dark:bg-slate-800/60",
      dotColor: "bg-slate-400 dark:bg-slate-500",
      textColor: "text-slate-800 dark:text-slate-200",
    },
    {
      label: "In Progress",
      status: "IN_PROGRESS",
      bg: "bg-blue-50/40 dark:bg-blue-950/20",
      border: "border-blue-200/60 dark:border-blue-900/40",
      headerBg: "bg-blue-100/50 dark:bg-blue-900/40",
      dotColor: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Under Review",
      status: "REVIEW",
      bg: "bg-amber-50/40 dark:bg-amber-950/20",
      border: "border-amber-200/60 dark:border-amber-900/40",
      headerBg: "bg-amber-100/50 dark:bg-amber-900/40",
      dotColor: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Completed",
      status: "COMPLETED",
      bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
      border: "border-emerald-200/60 dark:border-emerald-900/40",
      headerBg: "bg-emerald-100/50 dark:bg-emerald-900/40",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-300",
    },
  ];

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40";
      case "MEDIUM":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
      case "HIGH":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/40";
      case "URGENT":
        return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800/50 font-bold shadow-xs";
    }
  };

  const formatDueDate = (dueDateStr: string | null, status: TaskStatus) => {
    if (!dueDateStr) return { text: "No due date", isOverdue: false, isDueToday: false, label: "" };
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime()) || due.getFullYear() < 2020) {
      return { text: "No due date", isOverdue: false, isDueToday: false, label: "" };
    }

    if (status === "COMPLETED") {
      return { text: due.toLocaleDateString([], { month: "short", day: "numeric" }), isOverdue: false, isDueToday: false, label: "Done" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      if (days > 180) {
        return {
          text: due.toLocaleDateString([], { month: "short", day: "numeric" }),
          isOverdue: true,
          isDueToday: false,
          label: "Overdue",
        };
      }
      return {
        text: `${days}d overdue`,
        isOverdue: true,
        isDueToday: false,
        label: `Overdue by ${days}d`,
      };
    }
    if (diffDays === 0) {
      return {
        text: "Due Today",
        isOverdue: false,
        isDueToday: true,
        label: "Due Today",
      };
    }
    if (diffDays === 1) {
      return {
        text: "Due Tomorrow",
        isOverdue: false,
        isDueToday: false,
        label: "Due Tomorrow",
      };
    }

    return {
      text: due.toLocaleDateString([], { month: "short", day: "numeric" }),
      isOverdue: false,
      isDueToday: false,
      label: `In ${diffDays} days`,
    };
  };

  const myTasksCount = tasks.filter((t) => t.assigneeId === currentUserId).length;

  return (
    <div className="flex flex-col h-full w-full gap-4 min-h-0">
      {/* Filters & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0 w-full">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search box */}
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-450 focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* My Tasks Filter Pill */}
          <button
            type="button"
            onClick={() => setMyTasksOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              myTasksOnly
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>My Tasks</span>
            {myTasksCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${myTasksOnly ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                {myTasksCount}
              </span>
            )}
          </button>

          {/* Priority filter pills */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750">
            {["", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedPriority === p
                    ? "bg-white dark:bg-slate-750 text-slate-900 dark:text-white font-semibold shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {p === "" ? "All Priorities" : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Assignee Filter Dropdown */}
          <select
            value={selectedAssignee}
            onChange={(e) => {
              setSelectedAssignee(e.target.value);
              if (myTasksOnly) setMyTasksOnly(false);
            }}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Team Members</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-all border border-slate-200 dark:border-slate-750"
            title="Refresh tasks"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-750 rounded-xl overflow-hidden p-0.5 bg-slate-50 dark:bg-slate-850">
            <button
              type="button"
              onClick={() => {
                setViewType("board");
                setPage(1);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                viewType === "board"
                  ? "bg-white dark:bg-slate-750 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewType("list");
                setPage(1);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                viewType === "list"
                  ? "bg-white dark:bg-slate-750 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Table List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Add Task Button */}
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Main Board View: Responsive Kanban Grid with mobile horizontal swipe */}
      {viewType === "list" ? (
        <div className="flex-1 min-h-0 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <TaskList
            tasks={tasks}
            total={total}
            page={page}
            limit={10}
            sortField={sortField}
            sortOrder={sortOrder}
            onPageChange={(p) => setPage(p)}
            onSortChange={(field) => {
              if (sortField === field) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortField(field);
                setSortOrder("desc");
              }
              setPage(1);
            }}
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0 flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto md:overflow-hidden pb-2 md:pb-0 snap-x snap-mandatory">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            const isDragTarget = dragOverCol === col.status;

            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverCol !== col.status) setDragOverCol(col.status);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverCol === col.status) setDragOverCol(null);
                }}
                onDrop={(e) => handleDropOnColumn(col.status, e)}
                className={`flex flex-col h-full min-h-0 overflow-hidden rounded-2xl border transition-all duration-200 p-3.5 w-[85vw] sm:w-[320px] shrink-0 md:w-auto md:shrink snap-center ${col.bg} ${
                  isDragTarget
                    ? "ring-2 ring-primary border-primary bg-primary/10 dark:bg-primary/15 shadow-xl scale-[1.008]"
                    : col.border
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${col.dotColor} shadow-xs`} />
                    <h2 className={`font-bold text-xs uppercase tracking-wider ${col.textColor}`}>
                      {col.label}
                    </h2>
                    <span className="h-5 px-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => setCreateOpen(true)}
                      title={`Add task to ${col.label}`}
                      className="p-1 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Column Cards Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar">
                  {isLoading ? (
                    <div className="h-32 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : colTasks.length === 0 ? (
                    <div
                      className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 text-xs italic transition-colors ${
                        isDragTarget
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 opacity-50" />
                      <span>{isDragTarget ? "Drop here!" : "No tasks in this column"}</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isMyTask = task.assigneeId === currentUserId;
                      const isBeingDragged = draggedTaskId === task.id;
                      const dueInfo = formatDueDate(task.dueDate, task.status);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedTaskId(task.id);
                            e.dataTransfer.setData("text/plain", task.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverCol(null);
                          }}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`group/card relative bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 space-y-3 select-none ${
                            isBeingDragged
                              ? "opacity-40 scale-95 border-dashed border-primary ring-2 ring-primary/30"
                              : isMyTask
                              ? "border-primary/40 bg-gradient-to-b from-primary/[0.02] to-transparent hover:border-primary"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          {/* Card Header: Priority & Quick Drag Handle */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase border ${getPriorityStyle(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                              {isMyTask && (
                                <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                  Me
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400">
                              {task._count && task._count.comments > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{task._count.comments}</span>
                                </div>
                              )}
                              <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-650 group-hover/card:text-slate-500 transition-colors" />
                            </div>
                          </div>

                          {/* Task Title */}
                          <h3 className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                            {task.title}
                          </h3>

                          {/* Task Description snippet */}
                          {task.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Interactive Progress Bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px]">
                                Progress
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-primary font-mono">{task.progress}%</span>
                                {task.progress < 100 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleIncrementProgress(task, e)}
                                    title="Add 25% progress"
                                    className="text-[9px] font-bold text-slate-400 hover:text-primary px-1 py-0.2 rounded hover:bg-primary/10 transition-colors"
                                  >
                                    +25%
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  task.progress === 100
                                    ? "bg-emerald-500"
                                    : task.progress >= 50
                                    ? "bg-primary"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer: Due Date & Assignee */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            {/* Due Date Indicator */}
                            <div className="flex flex-col gap-1">
                              <div
                                className={`flex items-center gap-1 text-[10px] font-semibold ${
                                  dueInfo.isOverdue
                                    ? "text-red-500 font-bold animate-pulse"
                                    : dueInfo.isDueToday
                                    ? "text-amber-500 font-bold"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                                title={dueInfo.label}
                              >
                                {dueInfo.isOverdue ? (
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                ) : dueInfo.isDueToday ? (
                                  <Clock className="h-3 w-3 shrink-0" />
                                ) : (
                                  <Calendar className="h-3 w-3 shrink-0" />
                                )}
                                <span>{dueInfo.text}</span>
                              </div>

                              {/* Quick Move Status Trigger */}
                              {task.status !== "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickMove(task.id, task.status, e)}
                                  className="flex items-center gap-1 px-2 py-0.5 mt-0.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-md text-[9px] font-bold transition-all border border-primary/20 hover:shadow-xs group/btn w-fit"
                                >
                                  <span>
                                    {task.status === "TODO"
                                      ? "Start"
                                      : task.status === "IN_PROGRESS"
                                      ? "Review"
                                      : "Complete"}
                                  </span>
                                  <ArrowRight className="h-2.5 w-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                              )}
                            </div>

                            {/* Assignee Avatar */}
                            <div className="flex items-center gap-1.5" title={`Assigned to: ${task.assignee?.name || task.assignee?.email || 'Unassigned'}`}>
                              {task.assignee?.profilePictureURL ? (
                                <img
                                  src={task.assignee.profilePictureURL}
                                  alt={task.assignee.name || ""}
                                  className="h-7 w-7 rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-2xs"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-750 dark:to-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-2xs">
                                  {task.assignee?.name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Drop hint when dragging over column with tasks */}
                  {isDragTarget && colTasks.length > 0 && (
                    <div className="p-3 border-2 border-dashed border-primary bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xs animate-pulse">
                      Drop task here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {createOpen && <TaskCreateModal onClose={() => setCreateOpen(false)} />}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          userRole={userRole}
          isOwner={isOwner}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
