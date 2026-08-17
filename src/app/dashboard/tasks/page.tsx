"use client";

import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { adminSchema } from "@/features/auth/schema/admin.schema";
import { TaskBoard } from "@/features/tasks/components/TaskBoard";
import { useStaffList } from "@/features/chat/hooks/use-chat-messages";
import { Loader2, ClipboardList } from "lucide-react";

export default function TasksPage() {
  const { data, isLoading: userLoading } = useCurrentUser();
  const admin = !userLoading && data?.data ? adminSchema.parse(data.data) : null;

  // Initialize staff list cache for assignee selectors
  useStaffList();

  if (userLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-sm text-red-500 font-semibold">Access Denied. Please log in as an administrator.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6 p-5 sm:p-6 overflow-hidden min-h-0 bg-slate-50/50 dark:bg-slate-950">
      {/* Title block */}
      <div className="flex items-center gap-2.5 mb-3.5 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-2xs">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
            Task Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign tasks to team members, set priorities, and drag & drop across status columns.
          </p>
        </div>
      </div>

      {/* Main Board view */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
        <TaskBoard
          currentUserId={admin.id}
          userRole={admin.role}
          isOwner={admin.isOwner}
        />
      </div>
    </div>
  );
}
