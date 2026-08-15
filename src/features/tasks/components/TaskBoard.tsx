"use client";

import { useState } from "react";
import { useTasks, useUpdateTaskGeneric } from "../hooks/use-tasks";
import { useChatStore } from "@/features/chat/store/use-chat-store";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskList } from "./TaskList";
import { Plus, Search, Calendar, MessageSquare, AlertCircle, RefreshCw, ArrowRight, LayoutGrid, List } from "lucide-react";
import type { TaskStatus, TaskPriority } from "../types/tasks.types";

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

  const handleQuickMove = (taskId: string, currentStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: TaskStatus | null = null;
    if (currentStatus === "TODO") nextStatus = "IN_PROGRESS";
    else if (currentStatus === "IN_PROGRESS") nextStatus = "REVIEW";
    else if (currentStatus === "REVIEW") nextStatus = "COMPLETED";

    if (nextStatus) {
      updateTask.mutate({ taskId, payload: { status: nextStatus } });
    }
  };

  // Group tasks by status columns
  const columns: { label: string; status: TaskStatus; bg: string; border: string; text: string }[] = [
    { label: "To Do", status: "TODO", bg: "bg-slate-50/50 dark:bg-slate-900/10", border: "border-slate-200 dark:border-slate-800", text: "text-slate-850 dark:text-slate-200" },
    { label: "In Progress", status: "IN_PROGRESS", bg: "bg-blue-50/10 dark:bg-blue-950/5", border: "border-blue-100 dark:border-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    { label: "Under Review", status: "REVIEW", bg: "bg-amber-50/10 dark:bg-amber-950/5", border: "border-amber-100 dark:border-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
    { label: "Completed", status: "COMPLETED", bg: "bg-emerald-50/10 dark:bg-emerald-950/5", border: "border-emerald-100 dark:border-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  ];

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30";
      case "MEDIUM":
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50";
      case "HIGH":
        return "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30";
      case "URGENT":
        return "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-pulse";
    }
  };

  const isOverdue = (dueDateStr: string | null, status: TaskStatus) => {
    if (!dueDateStr || status === "COMPLETED") return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              myTasksOnly
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            👤 Assigned to Me
          </button>

          {!myTasksOnly && (
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Assignees</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-all shadow-xs flex items-center justify-center border border-slate-200 dark:border-slate-700"
            title="Refresh board"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-0.5 bg-slate-50 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setViewType("board");
                setPage(1);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                viewType === "board"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Kanban Board"
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
                  ? "bg-white dark:bg-slate-700 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Table List"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        )}
      </div>

      {viewType === "list" ? (
        <div className="flex-1 min-h-0">
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
        <div className="flex-1 overflow-x-auto min-h-0 flex gap-4 pb-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);

            return (
              <div
                key={col.status}
                className={`flex-1 min-w-[260px] max-w-[340px] rounded-2xl border ${col.border} ${col.bg} flex flex-col p-4 h-full`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <span className={`font-semibold text-xs uppercase tracking-wider ${col.text}`}>
                    {col.label}
                  </span>
                  <span className="h-5 px-2 bg-slate-200/50 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards scroll list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                  {isLoading ? (
                    <div className="h-24 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : colTasks.length === 0 ? (
                    <div className="h-24 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs italic">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isMyTask = task.assigneeId === currentUserId;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`bg-white dark:bg-slate-900 border hover:border-primary/50 dark:hover:border-primary/50 rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3 select-none ${
                            isMyTask
                              ? "border-primary/50 ring-2 ring-primary/10 dark:ring-primary/20 bg-primary/[0.01]"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {/* Priority */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider ${getPriorityStyle(task.priority)}`}>
                                {task.priority}
                              </span>
                              {isMyTask && (
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                  Me
                                </span>
                              )}
                            </div>
                            {task._count && task._count.comments > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-450 font-medium">
                                <MessageSquare className="h-3 w-3" />
                                <span>{task._count.comments}</span>
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                            {task.title}
                          </p>

                          {/* Progress Line */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <span>Progress</span>
                              <span className="text-primary">{task.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Due Date & Assignee Avatar */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex flex-col gap-1">
                              {task.dueDate ? (
                                <div className={`flex items-center gap-1 text-[9px] font-semibold ${
                                  isOverdue(task.dueDate, task.status)
                                    ? "text-red-500 animate-pulse"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}>
                                  {isOverdue(task.dueDate, task.status) ? (
                                    <AlertCircle className="h-3 w-3" />
                                  ) : (
                                    <Calendar className="h-3 w-3" />
                                  )}
                                  <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                                </div>
                              ) : (
                                <div className="text-[9px] text-slate-400">No due date</div>
                              )}

                              {/* Quick Move Status Trigger */}
                              {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickMove(task.id, task.status, e)}
                                  className="flex items-center gap-1 px-1.5 py-0.5 mt-0.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-md text-[8px] font-bold transition-all border border-primary/20 hover:shadow-xs group w-fit"
                                >
                                  <span>
                                    {task.status === "TODO"
                                      ? "Start"
                                      : task.status === "IN_PROGRESS"
                                      ? "Submit"
                                      : "Complete"}
                                  </span>
                                  <ArrowRight className="h-2 w-2 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              )}
                            </div>

                            {/* Assignee Avatar */}
                            {task.assignee?.profilePictureURL ? (
                              <img
                                src={task.assignee.profilePictureURL}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover shrink-0"
                                title={task.assignee.name ?? ""}
                              />
                            ) : (
                              <div
                                className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0"
                                title={task.assignee?.name ?? ""}
                              >
                                {task.assignee?.name?.[0]?.toUpperCase() ?? "?"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
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
