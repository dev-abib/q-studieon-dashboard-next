"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  Clock,
  Laptop,
  Users,
  ShieldCheck,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  Crown,
  Eye,
  ShieldAlert,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import {
  useAuditLogs,
  useTeamWorkTimeSummary,
} from "@/features/admin/hooks/use-audit-logs";
import { useSecurityAlerts } from "@/features/admin/hooks/use-security-alerts";
import { useGetAllAdmins } from "@/features/admin/hooks/user-get-all-admins";
import { adminApi } from "@/services/admin-api";

export default function TeamActivityPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [viewTab, setViewTab] = useState<"feed" | "leaderboard">("feed");

  // Fetch security alerts
  const alertsData = useSecurityAlerts();

  // Fetch summary & audit logs
  const { data: summaryData, isLoading: summaryLoading } = useTeamWorkTimeSummary();
  const { data: logsData, isLoading: logsLoading } = useAuditLogs({
    page,
    limit: 15,
    staffId: selectedStaff !== "all" ? selectedStaff : undefined,
    action: selectedAction !== "all" ? selectedAction : undefined,
    entityType: selectedEntity !== "all" ? selectedEntity : undefined,
    search: search.trim() || undefined,
  });

  const { data: allStaffData } = useGetAllAdmins({ page: 1, limit: 50 });
  const staffList = allStaffData?.data?.directory || [];

  const metrics = summaryData?.metrics;
  const leaderboard = summaryData?.leaderboard || [];
  const logs = logsData?.logs || [];
  const meta = logsData?.meta;

  const getActionBadgeColor = (action: string) => {
    if (action.includes("GRANT") || action.includes("CREATE")) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("REVOKE") || action.includes("DELETE") || action.includes("BLOCK")) {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (action.includes("REPLY") || action.includes("INQUIRY")) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
    if (action.includes("PERMISSION") || action.includes("PASSWORD")) {
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  };

  const topStats = [
    {
      label: "Total Team Work Time",
      value: summaryLoading ? "..." : `${metrics?.totalTeamHours || 0} hrs`,
      change: "across all staff",
      positive: true,
      icon: "⏱️",
    },
    {
      label: "Worked Today",
      value: summaryLoading ? "..." : `${metrics?.todayTeamHours || 0} hrs`,
      change: "logged today",
      positive: true,
      icon: "📈",
    },
    {
      label: "Active Staff Today",
      value: summaryLoading ? "..." : `${metrics?.activeTodayCount || 0}/${metrics?.totalStaffCount || 0}`,
      change: "online & working",
      positive: true,
      icon: "👥",
    },
    {
      label: "Total Platform Actions",
      value: meta?.total ?? logs.length,
      change: "audit trail events",
      positive: null,
      icon: "✨",
    },
    {
      label: "Security Alerts",
      value: alertsData.unresolvedCount,
      change: alertsData.unresolvedCount > 0 ? "requires review" : "system secure",
      positive: alertsData.unresolvedCount === 0,
      icon: "🛡️",
    },
  ];

  return (
    <section className="w-full flex flex-col gap-6">
      {/* ── Page Header matching Dashboard ── */}
      <PageHeader
        kicker="Team Activity & Work Tracking Central"
        title="Team Surveillance & Activity Feed"
        icon={Activity}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/admins">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-3 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Team Directory</span>
            </Button>
          </Link>

          <a
            href={adminApi.exportWorkTimeCsvUrl}
            download="team-work-time.csv"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Export Hours CSV</span>
          </a>

          <a
            href={adminApi.exportAuditLogsCsvUrl}
            download="site-audit-logs.csv"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-purple-500" />
            <span>Export Audit CSV</span>
          </a>
        </div>
      </PageHeader>

      {/* ── Top 5 Stat Cards (Matching Dashboard Theme) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {topStats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm">
                {stat.icon}
              </span>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  stat.positive === true
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Security & Anomaly Alerts Banner (If any) ── */}
      {alertsData.alerts.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Security & Anomaly Alerts</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white">
                    {alertsData.unresolvedCount} Unresolved
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Suspicious sign-in locations, impossible travel, and multi-IP concurrency events.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-rose-100 dark:divide-rose-900/40 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 overflow-hidden">
            {alertsData.alerts.map((alert) => (
              <div key={alert.id} className="p-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{alert.description}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => alertsData.resolveAlert(alert.id)}
                  disabled={alertsData.isResolving}
                  className="h-8 px-3 text-xs font-semibold rounded-xl shrink-0"
                >
                  Mark Resolved
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setViewTab("feed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewTab === "feed"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span>Real-Time Audit Feed</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewTab === "leaderboard"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-emerald-500" />
          <span>Team Hours Leaderboard</span>
        </button>
      </div>

      {/* ── TAB 1: AUDIT FEED ── */}
      {viewTab === "feed" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search staff, action, or target…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
              />
            </div>

            <select
              value={selectedStaff}
              onChange={(e) => {
                setSelectedStaff(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Team Members</option>
              {staffList.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Action Types</option>
              <option value="GRANT_SUBSCRIPTION">Grant Subscription</option>
              <option value="REVOKE_SUBSCRIPTION">Revoke Subscription</option>
              <option value="DELETE_QUERY">Delete Query</option>
              <option value="REPLY_INQUIRY">Reply Inquiry</option>
              <option value="TOGGLE_PERMISSION">Toggle Permission</option>
              <option value="CREATE_ADMIN">Create Staff</option>
              <option value="DELETE_ADMIN">Delete Staff</option>
              <option value="CREATE_FAQ">Create FAQ</option>
              <option value="UPDATE_FAQ">Update FAQ</option>
              <option value="DELETE_FAQ">Delete FAQ</option>
              <option value="UPDATE_DYNAMIC_PAGE">Update Page</option>
              <option value="FLAG_USER">Flag User</option>
            </select>

            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Target Modules</option>
              <option value="User">User Accounts</option>
              <option value="Subscription">Subscriptions</option>
              <option value="ContactQuery">Support Queries</option>
              <option value="StaffPermission">Permissions</option>
              <option value="StaffAccount">Staff Accounts</option>
              <option value="FAQ">Knowledge FAQ</option>
              <option value="DynamicPage">Content Pages</option>
            </select>
          </div>

          {/* Audit Logs Table */}
          {logsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-medium text-slate-400">Loading audit feed…</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionBadgeColor(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>

                      <Link
                        href={`/dashboard/admins/${log.staffId}`}
                        className="text-xs font-bold text-slate-800 dark:text-white hover:text-primary transition-colors"
                      >
                        {log.staff?.name || log.staffName || "Staff Member"}
                      </Link>

                      <span className="text-slate-400 text-xs">→</span>

                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {log.entityType}: {log.entityTitle || "Item"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {log.details || "Administrative task execution recorded in system."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 self-end sm:self-center">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              No audit logs match your filter criteria.
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                Page {meta.page} of {meta.totalPages} ({meta.total} events)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 text-xs rounded-xl font-semibold"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-3 text-xs rounded-xl font-semibold"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: LEADERBOARD ── */}
      {viewTab === "leaderboard" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Team Member Work Hours & Productivity Leaderboard
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by total session duration and administrative tasks performed.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-slate-400">
                  <th className="px-5 py-3.5 font-semibold">Rank & Member</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Today&apos;s Hours</th>
                  <th className="px-5 py-3.5 font-semibold">Weekly Hours</th>
                  <th className="px-5 py-3.5 font-semibold">Total Logged Time</th>
                  <th className="px-5 py-3.5 font-semibold">Tasks Completed</th>
                  <th className="px-5 py-3.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((member, idx) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-500/10 text-amber-600" :
                        idx === 1 ? "bg-slate-200 text-slate-700" :
                        idx === 2 ? "bg-amber-700/10 text-amber-800" : "bg-slate-100 text-slate-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{member.email}</p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {member.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {member.todayHours} hrs
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {member.thisWeekHours} hrs
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {member.totalHours} hrs
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-purple-600 dark:text-purple-400">
                      {member.tasksPerformed} tasks
                    </td>

                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/admins/${member.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg font-semibold px-2.5">
                          View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
