"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  X,
  User,
  UserCheck,
  UserX,
  Eye,
  Send,
  Ban,
  Unlock,
  Flag,
  RotateCcw,
  Copy,
  CheckCheck,
  FileBarChart2,
  FolderKanban,
  CreditCard,
  Crown,
  Sparkles,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  Check,
  MessageSquare,
  DollarSign,
  Activity,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { useGetAllUsers } from "@/features/users/hooks/use.users";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { useSendAdminMail } from "@/features/admin/hooks/use-send-admin-mail";
import {
  useBlockUser,
  useUnblockUser,
  useSoftDeleteUser,
  useRestoreUser,
  useFlagUser,
  useGrantUserAccess,
  useRevokeUserAccess,
} from "@/features/admin/hooks/use-user-moderation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
export interface UserDirectoryItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  userRole?: string | null;
  isPaid?: boolean;
  isGuest?: boolean | null;
  isOtpVerified?: boolean;
  status?: string;
  billingCycle?: string;
  currentPeriodEnd?: number | null;
  adminGrantedAccess?: boolean | null;
  adminGrantedReason?: string | null;
  adminGrantedBy?: string | null;
  adminGrantedAt?: string | null;
  blockedUntil?: string | null;
  blockReason?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  purgeAt?: string | null;
  deleteReason?: string | null;
  lastLoginAt?: string | null;
  lastActiveIp?: string | null;
  loginCount?: number | null;
  totalSessionMinutes?: number | null;
  profilePictureURL: string | null;
  createdAt: string;
  _count?: {
    reports?: number;
    collections?: number;
    payments?: number;
    contactQueries?: number;
    sessions?: number;
  };
}

function getUserEngagementTier(u: UserDirectoryItem) {
  const reports = u._count?.reports || 0;
  const now = new Date();
  const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt) : new Date(u.createdAt);
  const isDormant = (now.getTime() - lastLogin.getTime()) > (30 * 24 * 60 * 60 * 1000) && reports === 0;

  if (reports >= 10) {
    return {
      tier: "power",
      label: "Power User",
      color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
      icon: "🚀",
      desc: "Frequent generator (10+ reports)",
    };
  }
  if (reports >= 3) {
    return {
      tier: "active",
      label: "Active Regular",
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
      icon: "⚡",
      desc: "Regular activity (3-9 reports)",
    };
  }
  if (reports >= 1) {
    return {
      tier: "occasional",
      label: "Occasional",
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      icon: "🌱",
      desc: "1-2 reports generated",
    };
  }
  if (isDormant) {
    return {
      tier: "dormant",
      label: "Dormant",
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      icon: "💤",
      desc: "Inactive for >30 days",
    };
  }
  return {
    tier: "explorer",
    label: "Explorer",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: "🔍",
    desc: "Browsing / saved items (0 reports)",
  };
}

type SortDir = "asc" | "desc" | null;
type SortField = "name" | "email" | "role" | "userRole" | "status" | "createdAt";

const AVATAR_PALETTES = [
  { bg: "bg-primary/10 text-primary border-primary/20" },
  { bg: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  { bg: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { bg: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { bg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
];

function avatarPalette(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatTimeAgo = (iso: string | null | undefined): string => {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSec < 60) return "Just now";
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 60) return `${diffInMin}m ago`;
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const formatPersonaRole = (role?: string | null): string => {
  if (!role) return "General User";
  return role
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getDaysRemaining = (purgeAtIso?: string | null): number => {
  if (!purgeAtIso) return 0;
  try {
    const purgeDate = new Date(purgeAtIso).getTime();
    const now = Date.now();
    const diffMs = purgeDate - now;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
};

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentColor,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 text-left transition-all group cursor-pointer ${
        active
          ? "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800 shrink-0 group-hover:scale-105 transition-transform ${accentColor}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {sub && (
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}

// Sort Button Helper
function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon =
    !active || dir === null ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
        active
          ? "text-primary font-bold"
          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {label}
      <Icon
        className={`h-3.5 w-3.5 ${
          active ? "text-primary" : "text-slate-300 dark:text-slate-600"
        }`}
      />
    </button>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [engagementFilter, setEngagementFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Quick Action Modal Target States
  const [emailTarget, setEmailTarget] = useState<UserDirectoryItem | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [blockTarget, setBlockTarget] = useState<UserDirectoryItem | null>(null);
  const [blockDurationDays, setBlockDurationDays] = useState<number>(7);
  const [blockCustomDate, setBlockCustomDate] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("");

  const [flagTarget, setFlagTarget] = useState<UserDirectoryItem | null>(null);
  const [flagAction, setFlagAction] = useState<"BLOCK" | "DELETE">("BLOCK");
  const [flagReason, setFlagReason] = useState<string>("");
  const [flagNote, setFlagNote] = useState<string>("");

  const [deleteTarget, setDeleteTarget] = useState<UserDirectoryItem | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>("");
  const [immediateHardDelete, setImmediateHardDelete] = useState<boolean>(false);

  // Subscription Grant & Revoke state
  const [grantTarget, setGrantTarget] = useState<UserDirectoryItem | null>(null);
  const [grantPlan, setGrantPlan] = useState<"1_month" | "3_months" | "6_months" | "1_year" | "custom" | "lifetime">("1_month");
  const [grantCustomEndDate, setGrantCustomEndDate] = useState<string>("");
  const [grantReason, setGrantReason] = useState<string>("");
  const [grantBillingCycle, setGrantBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [revokeTarget, setRevokeTarget] = useState<UserDirectoryItem | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Current User Session
  const { data: userData } = useCurrentUser();
  const currentUser = userData?.data || userData;
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.isOwner;
  const isCustomerSupport = currentUser?.role === "customer_support";

  // Data Fetching
  const { data, isLoading, isFetching, refetch } = useGetAllUsers({
    page,
    limit,
    search,
    sortBy: sortField ?? undefined,
    sortOrder: sortDir ?? undefined,
  });

  const rawUsers: UserDirectoryItem[] = data?.data?.directory ?? [];
  const meta = data?.data?.meta;

  // Mutations
  const { mutateAsync: sendAdminMail, isPending: isSendingMail } = useSendAdminMail();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const softDeleteMutation = useSoftDeleteUser();
  const restoreMutation = useRestoreUser();
  const flagMutation = useFlagUser();
  const grantAccessMutation = useGrantUserAccess();
  const revokeAccessMutation = useRevokeUserAccess();

  // Client-side Filter for quick status, persona, and engagement tabs
  const filteredUsers = useMemo(() => {
    return rawUsers.filter(u => {
      if (personaFilter !== "all" && u.userRole !== personaFilter) return false;
      if (engagementFilter !== "all") {
        const eng = getUserEngagementTier(u);
        if (eng.tier !== engagementFilter) return false;
      }
      if (statusFilter === "all") return true;
      if (statusFilter === "paid") return Boolean(u.isPaid);
      if (statusFilter === "free") return !Boolean(u.isPaid);
      if (statusFilter === "verified") return Boolean(u.isOtpVerified);
      if (statusFilter === "blocked")
        return Boolean(u.blockedUntil && new Date(u.blockedUntil) > new Date());
      if (statusFilter === "deleted") return Boolean(u.isDeleted);
      if (statusFilter === "guest") return Boolean(u.isGuest);
      return true;
    });
  }, [rawUsers, statusFilter, personaFilter, engagementFilter]);

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField(null);
      setSortDir(null);
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Handlers
  const handleOpenEmailModal = (user: UserDirectoryItem) => {
    setEmailTarget(user);
    setEmailSubject("");
    setEmailMessage("");
  };

  const handleSendQuickEmail = async () => {
    if (!emailTarget?.email || !emailSubject.trim() || !emailMessage.trim()) return;

    try {
      await sendAdminMail({
        email: emailTarget.email,
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });
      toast.success(`Email sent successfully to ${emailTarget.email}`);
      setEmailTarget(null);
      setEmailSubject("");
      setEmailMessage("");
    } catch {
      toast.error("Failed to send message.");
    }
  };

  const handleSoftBlockConfirm = async () => {
    if (!blockTarget) return;

    let targetDate: Date;
    if (blockCustomDate) {
      targetDate = new Date(blockCustomDate);
    } else {
      targetDate = new Date(Date.now() + blockDurationDays * 24 * 60 * 60 * 1000);
    }

    if (isNaN(targetDate.getTime())) {
      toast.error("Invalid target date selected.");
      return;
    }

    try {
      await blockMutation.mutateAsync({
        id: blockTarget.id,
        blockedUntil: targetDate.toISOString(),
        reason: blockReason.trim() || undefined,
      });
      setBlockTarget(null);
      setBlockReason("");
      setBlockCustomDate("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleUnblock = async (user: UserDirectoryItem) => {
    try {
      await unblockMutation.mutateAsync(user.id);
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await softDeleteMutation.mutateAsync({
        id: deleteTarget.id,
        reason: deleteReason.trim() || undefined,
        immediateHardDelete,
      });
      setDeleteTarget(null);
      setDeleteReason("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleRestore = async (user: UserDirectoryItem) => {
    try {
      await restoreMutation.mutateAsync(user.id);
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleFlagConfirm = async () => {
    if (!flagTarget || !flagReason.trim()) return;

    try {
      await flagMutation.mutateAsync({
        id: flagTarget.id,
        action: flagAction,
        reason: flagReason.trim(),
        note: flagNote.trim() || undefined,
      });
      setFlagTarget(null);
      setFlagReason("");
      setFlagNote("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleGrantAccessConfirm = async () => {
    if (!grantTarget) return;
    if (grantPlan === "custom" && !grantCustomEndDate) {
      toast.error("Please pick a custom end date");
      return;
    }
    try {
      await grantAccessMutation.mutateAsync({
        userId: grantTarget.id,
        plan: grantPlan,
        customEndDate: grantPlan === "custom" ? new Date(grantCustomEndDate).toISOString() : undefined,
        reason: grantReason.trim() || undefined,
        billingCycle: grantBillingCycle,
      });
      setGrantTarget(null);
      setGrantReason("");
      setGrantCustomEndDate("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleRevokeAccessConfirm = async () => {
    if (!revokeTarget) return;
    try {
      await revokeAccessMutation.mutateAsync({
        userId: revokeTarget.id,
        reason: revokeReason.trim() || undefined,
      });
      setRevokeTarget(null);
      setRevokeReason("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  return (
    <section className="w-full flex flex-col gap-6 min-h-screen pb-20">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Platform Directory"
        title="Users & Members Directory"
        icon={Users}
        description="Search, monitor, communicate with, and manage registered users, paid subscribers, and visitor accounts."
      >
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              placeholder="Search by name or email…"
              className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 text-xs focus-visible:ring-primary shadow-2xs"
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* ── Stat Cards Grid (5-column layout matching dashboard) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={meta?.total?.toLocaleString() ?? `${rawUsers.length}`}
          sub="all directory accounts"
          accentColor="bg-primary/10 text-primary"
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        <StatCard
          icon={Crown}
          label="Paid Subscribers"
          value={meta?.paidCount?.toLocaleString() ?? "—"}
          sub="active subscriptions"
          accentColor="bg-amber-500/10 text-amber-600"
          active={statusFilter === "paid"}
          onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}
        />
        <StatCard
          icon={UserCheck}
          label="OTP Verified"
          value={meta?.otpVerifiedCount?.toLocaleString() ?? "—"}
          sub="verified identities"
          accentColor="bg-emerald-500/10 text-emerald-600"
          active={statusFilter === "verified"}
          onClick={() => setStatusFilter(statusFilter === "verified" ? "all" : "verified")}
        />
        <StatCard
          icon={User}
          label="Guest Accounts"
          value={`${rawUsers.filter(u => u.isGuest).length || (meta?.total ? Math.max(0, meta.total - (meta.otpVerifiedCount || 0)) : 0)}`}
          sub="temporary sessions"
          accentColor="bg-blue-500/10 text-blue-600"
          active={statusFilter === "guest"}
          onClick={() => setStatusFilter(statusFilter === "guest" ? "all" : "guest")}
        />
        <StatCard
          icon={Ban}
          label="Moderated Accounts"
          value={`${(meta?.blockedCount || 0) + (meta?.deletedCount || 0)}`}
          sub="suspended & deleted"
          accentColor="bg-rose-500/10 text-rose-600"
          active={statusFilter === "blocked" || statusFilter === "deleted"}
          onClick={() => setStatusFilter(statusFilter === "blocked" ? "deleted" : "blocked")}
        />
      </div>

      {/* ── Data Table Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max overflow-x-auto [scrollbar-width:none]">
            {[
              { id: "all", label: "All Users" },
              { id: "paid", label: "Paid" },
              { id: "free", label: "Free Tier" },
              { id: "verified", label: "Verified" },
              { id: "blocked", label: "Suspended" },
              { id: "deleted", label: "Soft-Deleted" },
              { id: "guest", label: "Guests" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 text-xs flex-wrap self-end md:self-auto">
            {/* Persona / User Role Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
              <select
                value={personaFilter}
                onChange={e => {
                  setPersonaFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden pr-2 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="home_owner">Homeowners</option>
                <option value="renter">Renters</option>
                <option value="real_estate_agent">Real Estate Agents</option>
                <option value="interior_designer">Interior Designers</option>
                <option value="architect">Architects</option>
                <option value="commercial_investor">Commercial Investors</option>
                <option value="feng_shui_enthusiast">Feng Shui Enthusiasts</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400 pl-1">Show:</span>
              <select
                value={limit}
                onChange={e => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden pr-2 cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                <th className="px-6 py-3.5">
                  <SortButton
                    label="User Name & Identity"
                    active={sortField === "name"}
                    dir={sortField === "name" ? sortDir : null}
                    onClick={() => handleSort("name")}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Email Address"
                    active={sortField === "email"}
                    dir={sortField === "email" ? sortDir : null}
                    onClick={() => handleSort("email")}
                  />
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Role
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Account Status"
                    active={sortField === "status"}
                    dir={sortField === "status" ? sortDir : null}
                    onClick={() => handleSort("status")}
                  />
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Activity
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Joined Date"
                    active={sortField === "createdAt"}
                    dir={sortField === "createdAt" ? sortDir : null}
                    onClick={() => handleSort("createdAt")}
                  />
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(u => {
                  const pal = avatarPalette(u.name ?? u.email ?? "");
                  const initials = (u.name ?? u.email ?? "??")
                    .slice(0, 2)
                    .toUpperCase();
                  const isBlocked = Boolean(
                    u.blockedUntil && new Date(u.blockedUntil) > new Date(),
                  );
                  const isDeleted = Boolean(u.isDeleted);
                  const daysToPurge = getDaysRemaining(u.purgeAt);

                  const reportsCount = u._count?.reports || 0;
                  const queriesCount = u._count?.contactQueries || 0;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Name & Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <Link
                            href={`/dashboard/users/${u.id}`}
                            className="relative shrink-0"
                          >
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs border overflow-hidden ${pal.bg}`}
                            >
                              {u.profilePictureURL ? (
                                <Image
                                  src={u.profilePictureURL}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  width={36}
                                  height={36}
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                isDeleted
                                  ? "bg-rose-500"
                                  : isBlocked
                                  ? "bg-amber-500"
                                  : u.isPaid
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          </Link>

                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/dashboard/users/${u.id}`}
                                className="font-semibold text-sm text-slate-900 dark:text-white hover:text-primary transition-colors truncate max-w-[170px]"
                              >
                                {u.name || "Anonymous User"}
                              </Link>
                              {u.isOtpVerified && (
                                <span title="OTP Verified">
                                  <ShieldCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <span>ID: {u.id.slice(0, 8)}…</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(u.id, u.id)}
                                className="hover:text-primary p-0.5 transition-colors"
                                title="Copy ID"
                              >
                                {copiedId === u.id ? (
                                  <CheckCheck className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5 opacity-60" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {u.email}
                        </span>
                      </td>

                      {/* Role / Persona */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.userRole ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                            {formatPersonaRole(u.userRole)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isDeleted ? (
                          <Badge variant="destructive" className="text-[11px] font-medium py-0.5 px-2">
                            Deleted ({daysToPurge}d left)
                          </Badge>
                        ) : isBlocked ? (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-medium py-0.5 px-2">
                            Suspended
                          </Badge>
                        ) : u.adminGrantedAccess ? (
                          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[11px] font-medium py-0.5 px-2">
                            Admin Grant
                          </Badge>
                        ) : u.isPaid ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium py-0.5 px-2">
                            Paid ({u.billingCycle || "Monthly"})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-[11px] font-medium py-0.5 px-2">
                            Free Tier
                          </Badge>
                        )}
                      </td>

                      {/* Usage & Activity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {reportsCount > 0 && queriesCount > 0
                            ? `${reportsCount} reports • ${queriesCount} inquiries`
                            : reportsCount > 0
                            ? `${reportsCount} ${reportsCount === 1 ? 'report' : 'reports'}`
                            : queriesCount > 0
                            ? `${queriesCount} ${queriesCount === 1 ? 'inquiry' : 'inquiries'}`
                            : "—"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/users/${u.id}`}
                            className="h-8 px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg text-xs">
                              <DropdownMenuItem
                                onClick={() => handleOpenEmailModal(u)}
                                disabled={Boolean(u.isGuest)}
                                className="gap-2 cursor-pointer font-medium"
                              >
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>Send Direct Email</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  if (u.isPaid) {
                                    setRevokeTarget(u);
                                    setRevokeReason("");
                                  } else {
                                    setGrantTarget(u);
                                    setGrantPlan("1_month");
                                    setGrantReason("");
                                    setGrantCustomEndDate("");
                                  }
                                }}
                                className="gap-2 cursor-pointer font-medium text-purple-600 dark:text-purple-400"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{u.isPaid ? "Manage / Revoke Access" : "Grant Subscription"}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setFlagTarget(u);
                                  setFlagReason("");
                                  setFlagNote("");
                                }}
                                className="gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
                              >
                                <Flag className="h-3.5 w-3.5" />
                                <span>Flag for Moderation</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {isBlocked ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnblock(u)}
                                  disabled={unblockMutation.isPending}
                                  className="gap-2 cursor-pointer font-medium text-emerald-600"
                                >
                                  <Unlock className="h-3.5 w-3.5" />
                                  <span>Unblock Account</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setBlockTarget(u);
                                    setBlockReason("");
                                    setBlockCustomDate("");
                                  }}
                                  className="gap-2 cursor-pointer font-medium text-amber-600"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  <span>Suspend Account</span>
                                </DropdownMenuItem>
                              )}

                              {isDeleted ? (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(u)}
                                  disabled={restoreMutation.isPending}
                                  className="gap-2 cursor-pointer font-medium text-emerald-600"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Restore Account</span>
                                </DropdownMenuItem>
                              ) : (
                                !isCustomerSupport && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeleteTarget(u);
                                      setDeleteReason("");
                                      setImmediateHardDelete(false);
                                    }}
                                    className="gap-2 cursor-pointer font-medium text-rose-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Soft-Delete Account</span>
                                  </DropdownMenuItem>
                                )
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-xs font-medium text-slate-400"
                  >
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Page-Wise Pagination Footer */}
        {meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
              <span>
                Showing <strong>{meta.total === 0 ? 0 : (page - 1) * limit + 1}</strong> -{" "}
                <strong>{Math.min(page * limit, meta.total)}</strong> of{" "}
                <strong>{meta.total}</strong> users
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
                className="h-8 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </Button>

              {/* Numbered Page Buttons with Sliding Window */}
              <div className="flex items-center gap-1 px-1">
                {(() => {
                  const totalPages = meta.totalPages || 1;
                  const pages: (number | string)[] = [];

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push("...");

                    const start = Math.max(2, page - 1);
                    const end = Math.min(totalPages - 1, page + 1);

                    for (let i = start; i <= end; i++) {
                      if (!pages.includes(i)) pages.push(i);
                    }

                    if (page < totalPages - 2) pages.push("...");
                    if (!pages.includes(totalPages)) pages.push(totalPages);
                  }

                  return pages.map((p, idx) => {
                    if (typeof p === "string") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-slate-400 font-bold select-none"
                        >
                          …
                        </span>
                      );
                    }
                    return (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={`h-8 w-8 p-0 text-xs font-bold rounded-xl ${
                          p === page
                            ? "bg-primary text-white shadow-xs"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </Button>
                    );
                  });
                })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="h-8 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: Quick Email Modal ── */}
      <Dialog
        open={Boolean(emailTarget)}
        onOpenChange={open => !open && setEmailTarget(null)}
      >
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          {emailTarget && (
            <div className="space-y-4 text-xs">
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Message {emailTarget.name || emailTarget.email}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Send an official email to <strong>{emailTarget.email}</strong>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 pt-1">
                {/* Template Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Templates:
                  </span>
                  {[
                    { title: "Account Notice", sub: "Important Notice Regarding Your Dwellr Account" },
                    { title: "Subscription Help", sub: "Assistance with your Dwellr Subscription" },
                    { title: "Inspection Follow-up", sub: "Update Regarding Your Recent Inspection Report" },
                  ].map(tpl => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => setEmailSubject(tpl.sub)}
                      className="px-2.5 py-1 rounded-lg text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200/60 dark:border-slate-700/60 font-medium shrink-0 whitespace-nowrap"
                    >
                      + {tpl.title}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Email Subject..."
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />

                  <textarea
                    rows={5}
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    placeholder={`Dear ${emailTarget.name || "Customer"},\n\nWe are contacting you from Dwellr administration...`}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y min-h-[120px] leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailTarget(null)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!emailSubject.trim() || !emailMessage.trim() || isSendingMail}
                  onClick={handleSendQuickEmail}
                  className="rounded-xl h-9 px-5 text-xs font-bold gap-1.5 shadow-xs"
                >
                  {isSendingMail ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Email</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: Quick Soft-Block Modal ── */}
      <Dialog
        open={Boolean(blockTarget)}
        onOpenChange={open => !open && setBlockTarget(null)}
      >
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          {blockTarget && (
            <div className="space-y-4 text-xs">
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Ban className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Soft-Block User Account
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Suspend <strong>{blockTarget.email}</strong> from logging in.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-1">
                {/* Duration Presets */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Select Suspension Duration:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { days: 1, label: "24 Hours" },
                      { days: 3, label: "3 Days" },
                      { days: 7, label: "7 Days" },
                      { days: 30, label: "30 Days" },
                    ].map(p => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => {
                          setBlockDurationDays(p.days);
                          setBlockCustomDate("");
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          blockDurationDays === p.days && !blockCustomDate
                            ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Or Custom Expiration Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={blockCustomDate}
                    onChange={e => setBlockCustomDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Suspension Reason:
                  </label>
                  <textarea
                    rows={3}
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Reason for suspension..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBlockTarget(null)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={blockMutation.isPending}
                  onClick={handleSoftBlockConfirm}
                  className="rounded-xl h-9 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs"
                >
                  {blockMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      <span>Confirm Soft-Block</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: Flag to Super Admin Modal ── */}
      <Dialog
        open={Boolean(flagTarget)}
        onOpenChange={open => !open && setFlagTarget(null)}
      >
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          {flagTarget && (
            <div className="space-y-4 text-xs">
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-3 text-purple-600">
                  <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Flag User to Super Admin
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Escalate <strong>{flagTarget.email}</strong> for executive review.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3.5 pt-1">
                {/* Action */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Recommended Action:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFlagAction("BLOCK")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        flagAction === "BLOCK"
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Ban className="h-4 w-4" />
                      <span>Request Soft-Block</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlagAction("DELETE")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        flagAction === "DELETE"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Request Deletion</span>
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Reason: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={flagReason}
                    onChange={e => setFlagReason(e.target.value)}
                    placeholder="Brief reason..."
                    className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Staff Note */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Additional Context / Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={flagNote}
                    onChange={e => setFlagNote(e.target.value)}
                    placeholder="Include evidence, ticket numbers or details..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFlagTarget(null)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!flagReason.trim() || flagMutation.isPending}
                  onClick={handleFlagConfirm}
                  className="rounded-xl h-9 px-5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                >
                  {flagMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="h-3.5 w-3.5" />
                      <span>Submit Flag</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL 4: Delete Account Confirmation ── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          {deleteTarget && (
            <div className="space-y-3.5 text-xs">
              <DialogHeader>
                <div className="flex items-center gap-3 text-destructive">
                  <div className="h-11 w-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {immediateHardDelete
                        ? "Permanently Purge User Account"
                        : "Soft-Delete User Account"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      {immediateHardDelete
                        ? "Irreversible permanent database removal."
                        : "60-day recovery retention policy applies."}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  {deleteTarget.name || "Anonymous User"}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {deleteTarget.email} (ID: {deleteTarget.id})
                </p>
                <p className="text-amber-700 dark:text-amber-400 font-medium text-[11px] pt-0.5">
                  {immediateHardDelete
                    ? "⚠️ Warning: This will immediately purge all reports, collections, and Stripe customer links."
                    : "🛡️ Notice: All user data is preserved for 60 days. You can restore this account at any time within 60 days."}
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Reason for Deletion:
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Reason..."
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-destructive/20 focus:border-destructive"
                />
              </div>

              {/* Super Admin Override Checkbox */}
              {isSuperAdmin && !immediateHardDelete && (
                <label className="flex items-center gap-2 pt-1 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={immediateHardDelete}
                    onChange={e => setImmediateHardDelete(e.target.checked)}
                    className="rounded border-slate-300 text-destructive focus:ring-destructive h-4 w-4"
                  />
                  <span className="text-xs">
                    Permanently purge immediately (Super Admin override)
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={softDeleteMutation.isPending}
                  onClick={handleDeleteConfirm}
                  className="rounded-xl h-9 text-xs font-bold gap-1.5 px-5"
                >
                  {softDeleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>
                        {immediateHardDelete ? "Purge Permanently" : "Confirm Soft Delete"}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: GRANT SUBSCRIPTION ACCESS MODAL ──────────────────────── */}
      <Dialog open={Boolean(grantTarget)} onOpenChange={open => !open && setGrantTarget(null)}>
        <DialogContent className="sm:max-w-xl w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          {grantTarget && (
            <div>
              <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Grant Subscription Access
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Grant complimentary active platform access to <strong>{grantTarget.name || grantTarget.email}</strong> without requiring Stripe checkout.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 my-3 text-xs">
                {/* Duration Plan Picker */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Select Access Duration:</span>
                    <span className="text-[10.5px] font-normal text-purple-600 dark:text-purple-400">
                      {grantPlan === "lifetime" ? "👑 Unlimited" : grantPlan === "custom" ? "📅 Custom Date" : "⚡ Preset Duration"}
                    </span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "1_month", label: "1 Month", sub: "30 Days Access", icon: "⚡" },
                      { id: "3_months", label: "3 Months", sub: "90 Days Access", icon: "🌟" },
                      { id: "6_months", label: "6 Months", sub: "180 Days Access", icon: "🚀" },
                      { id: "1_year", label: "1 Year", sub: "365 Days Access", icon: "💎" },
                      { id: "lifetime", label: "Lifetime", sub: "Unlimited Access", icon: "👑" },
                      { id: "custom", label: "Custom Range", sub: "Pick Specific End Date", icon: "📅" },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGrantPlan(item.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          grantPlan === item.id
                            ? "border-purple-600 bg-purple-500/10 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/20 font-bold shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-base">{item.icon}</span>
                          {grantPlan === item.id && (
                            <div className="h-4 w-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{item.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Input (If Custom selected) */}
                {grantPlan === "custom" && (
                  <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                    <label className="font-bold text-purple-900 dark:text-purple-200 block">
                      Select Custom End Date:
                    </label>
                    <input
                      type="date"
                      value={grantCustomEndDate}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      onChange={e => setGrantCustomEndDate(e.target.value)}
                      className="h-9 w-full rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
                    />
                    <p className="text-[10.5px] text-purple-700 dark:text-purple-300">
                      Access will remain active until 23:59:59 on the selected date.
                    </p>
                  </div>
                )}

                {/* Billing Cycle Label Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Display Billing Cycle:
                  </label>
                  <div className="flex items-center gap-2">
                    {(["monthly", "yearly"] as const).map(cycle => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setGrantBillingCycle(cycle)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                          grantBillingCycle === cycle
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {cycle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Admin Reason / Note */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Administrative Grant Reason / Note (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={grantReason}
                    onChange={e => setGrantReason(e.target.value)}
                    placeholder="E.g. VIP partner complimentary pass, influencer promo, beta testing account..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y min-h-[70px] leading-relaxed"
                  />
                </div>

                {/* Notice Callout */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5 leading-relaxed">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Elevation:</strong> The user's account will immediately have <code>isPaid = true</code>, unlocking full report generation, unlimited inquiries, and full pro features across web and mobile.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGrantTarget(null)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={grantAccessMutation.isPending}
                  onClick={handleGrantAccessConfirm}
                  className="rounded-xl h-9 px-5 text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  {grantAccessMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Granting Access...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Confirm & Grant Access</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: REVOKE SUBSCRIPTION ACCESS MODAL ──────────────────────── */}
      <Dialog open={Boolean(revokeTarget)} onOpenChange={open => !open && setRevokeTarget(null)}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          {revokeTarget && (
            <div>
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                    <Ban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Revoke Subscription Access
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Reset <strong>{revokeTarget.name || revokeTarget.email}</strong> back to the Free Tier.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 my-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs leading-relaxed">
                  This will immediately cancel active premium privileges. The user will be reverted to the Free tier and cannot generate paid reports until access is re-granted or purchased.
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Reason for Revocation (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={revokeReason}
                    onChange={e => setRevokeReason(e.target.value)}
                    placeholder="Reason for ending access..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-y min-h-[70px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokeTarget(null)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={revokeAccessMutation.isPending}
                  onClick={handleRevokeAccessConfirm}
                  className="rounded-xl h-9 px-5 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {revokeAccessMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      <span>Revoke Access</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
