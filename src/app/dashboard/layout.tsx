"use client";
import { Header } from "@/components/layout/dashboard/Header";
import { Sidebar } from "@/components/layout/dashboard/Sidebar";
import { Admin } from "@/features/admin/types/admin.types";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { adminSchema } from "@/features/auth/schema/admin.schema";

import { ImpersonationBanner } from "@/components/layout/dashboard/ImpersonationBanner";
import { useTeamPresence } from "@/features/admin/hooks/use-team-presence";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Global team presence and activity heartbeat
  useTeamPresence();

  const { data, isLoading } = useCurrentUser();

  const admin: Admin | null =
    !isLoading && data?.data ? adminSchema.parse(data.data) : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden bg-slate-50/70 dark:bg-slate-950 p-4 lg:p-6 gap-6">
        <Sidebar role={admin?.role ?? null} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {admin && <Header admin={admin} />}
          <main className="flex-1 overflow-y-auto rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-100/80 dark:border-slate-800/80 p-6 backdrop-blur-sm shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
