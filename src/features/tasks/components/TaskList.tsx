"use client";

import type { TaskAssignment, TaskStatus, TaskPriority } from "../types/tasks.types";
import { ChevronUp, ChevronDown, Calendar, MessageSquare, AlertCircle } from "lucide-react";

interface Props {
  tasks: TaskAssignment[];
  total: number;
  page: number;
  limit: number;
  sortField: string;
  sortOrder: "asc" | "desc";
  onPageChange: (page: number) => void;
  onSortChange: (field: "dueDate" | "createdAt" | "priority" | "progress") => void;
  onSelectTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  total,
  page,
  limit,
  sortField,
  sortOrder,
  onPageChange,
  onSortChange,
  onSelectTask,
}: Props) {
  const totalPages = Math.ceil(total / limit) || 1;

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1 text-primary" />
    );
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400";
      case "MEDIUM":
        return "bg-slate-100 text-slate-605 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50";
      case "HIGH":
        return "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400";
      case "URGENT":
        return "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold animate-pulse";
    }
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-450 border border-slate-200 dark:border-slate-750";
      case "IN_PROGRESS":
        return "bg-blue-500 text-white border-blue-600";
      case "REVIEW":
        return "bg-amber-500 text-white border-amber-600";
      case "COMPLETED":
        return "bg-emerald-500 text-white border-emerald-600";
      case "CANCELLED":
        return "bg-red-500 text-white border-red-600";
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 z-10 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Task Title</th>
              <th className="px-6 py-4 font-semibold">Assignee</th>
              <th
                onClick={() => onSortChange("priority")}
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
              >
                Priority {renderSortIcon("priority")}
              </th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th
                onClick={() => onSortChange("progress")}
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
              >
                Progress {renderSortIcon("progress")}
              </th>
              <th
                onClick={() => onSortChange("dueDate")}
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
              >
                Due Date {renderSortIcon("dueDate")}
              </th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic">
                  No tasks matched your search or filters.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/40"
                >
                  {/* Title & Comment Indicator */}
                  <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white max-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{task.title}</span>
                      {task._count && task._count.comments > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-medium">
                          <MessageSquare className="h-3 w-3" />
                          {task._count.comments}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      {task.assignee?.profilePictureURL ? (
                        <img
                          src={task.assignee.profilePictureURL}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                          {task.assignee?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="truncate max-w-[120px]">
                        {task.assignee?.name || task.assignee?.email}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getStatusStyle(task.status)}`}>
                      {task.status}
                    </span>
                  </td>

                  {/* Progress bar */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2 max-w-[100px]">
                      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-primary shrink-0">{task.progress}%</span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-3.5">
                    {task.dueDate ? (
                      <div className={`flex items-center gap-1 font-semibold ${
                        isOverdue(task.dueDate, task.status)
                          ? "text-red-500 animate-pulse"
                          : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {isOverdue(task.dueDate, task.status) ? (
                          <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5" />
                        )}
                        <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">No due date</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-3.5 text-right font-medium">
                    <span className="text-primary hover:underline text-[11px]">View Details</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
          <span className="text-xs text-slate-500 dark:text-slate-450">
            Page <b>{page}</b> of <b>{totalPages}</b> (Total {total} tasks)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
