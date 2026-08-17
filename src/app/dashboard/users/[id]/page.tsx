"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  CreditCard,
  Trash2,
  X,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Cpu,
  Globe,
  BadgeCheck,
  FileBarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  FolderKanban,
  Receipt,
  MailQuestion,
  ExternalLink,
  Copy,
  CheckCheck,
  Send,
  Sparkles,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  Layers,
  ArrowUpRight,
  Lock,
  Unlock,
  Flag,
  RotateCcw,
  MessageSquare,
  Flame,
  Reply,
  ArrowRight,
  Inbox,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  FileText,
  Building,
  Compass,
  Star,
  Eye,
  Filter,
  Check,
  Briefcase,
  DollarSign,
  TrendingUp,
  Activity,
  Maximize2,
  Ban,
  AlertOctagon,
  ShieldAlert,
  Laptop,
  Smartphone,
  Monitor,
  History,
  Zap,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatDuration = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return "< 1m";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
};

import { useUserDetails } from "@/features/admin/hooks/use-get-user-details";
import { useSendAdminMail } from "@/features/admin/hooks/use-send-admin-mail";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { useGetAllQueries } from "@/features/contact-queries/hooks/use-get-all-queries";
import { useReplyQuery } from "@/features/contact-queries/hooks/use-reply-query";
import {
  useBlockUser,
  useUnblockUser,
  useSoftDeleteUser,
  useRestoreUser,
  useFlagUser,
  useResolveFlag,
  useGrantUserAccess,
  useRevokeUserAccess,
} from "@/features/admin/hooks/use-user-moderation";
import { useTeamPresence } from "@/features/admin/hooks/use-team-presence";
import { InternalNotesSection } from "@/features/admin/components/InternalNotesSection";
import { adminApi } from "@/services/admin-api";
import {
  ContactQuery,
  ContactQueryPriority,
  ContactQueryStatus,
} from "@/features/contact-queries/types/contact-queries.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────────────────────
// Formatters & Utilities
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

const cap = (s: string | null | undefined): string => {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
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

// ─────────────────────────────────────────────────────────────────────────────
// Priority & Status Badges
// ─────────────────────────────────────────────────────────────────────────────

const getPriorityBadge = (priority?: ContactQueryPriority) => {
  switch (priority) {
    case "URGENT":
      return (
        <Badge
          variant="outline"
          className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold text-[10px] gap-1 shadow-2xs"
        >
          <Flame className="h-2.5 w-2.5 text-red-500" />
          Urgent
        </Badge>
      );
    case "HIGH":
      return (
        <Badge
          variant="outline"
          className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 font-semibold text-[10px]"
        >
          High
        </Badge>
      );
    case "LOW":
      return (
        <Badge
          variant="outline"
          className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]"
        >
          Low
        </Badge>
      );
    case "MEDIUM":
    default:
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]"
        >
          Medium
        </Badge>
      );
  }
};

const getStatusBadge = (status: ContactQueryStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-semibold text-[10px] gap-1"
        >
          <Clock className="h-2.5 w-2.5" />
          Pending
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 font-semibold text-[10px] gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          In Progress
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-semibold text-[10px] gap-1"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          Resolved
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge
          variant="outline"
          className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 font-semibold text-[10px]"
        >
          Closed
        </Badge>
      );
    default:
      return null;
  }
};

const getReportStatusBadge = (status?: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium py-0.5 px-2">
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-medium py-0.5 px-2">
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="text-[11px] font-medium py-0.5 px-2">
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px] font-medium text-slate-500 py-0.5 px-2">
          {cap(status)}
        </Badge>
      );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse pb-16 pt-2">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>

    <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800" />

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800" />
      ))}
    </div>

    <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section Card Helper
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {action}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  copyable = false,
  icon: Icon,
  badge,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  copyable?: boolean;
  icon?: React.ElementType;
  badge?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800/70 last:border-0 text-xs">
      <span className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
        {label}
      </span>

      <div className="flex items-center gap-2 min-w-0 justify-end">
        {badge}
        {value && (
          <span
            className={`truncate font-semibold text-slate-800 dark:text-slate-200 ${
              mono ? "font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md" : ""
            }`}
          >
            {value}
          </span>
        )}
        {copyable && typeof value === "string" && value !== "—" && (
          <button
            type="button"
            onClick={() => handleCopy(value)}
            className="text-slate-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Copy value"
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Control Component
// ─────────────────────────────────────────────────────────────────────────────

function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span>
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> items
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>• Show</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-7.5 px-2.5 rounded-lg text-xs gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </Button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-7.5 w-7.5 p-0 text-xs font-semibold rounded-lg"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-7.5 px-2.5 rounded-lg text-xs gap-1"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Main Component
// ─────────────────────────────────────────────────────────────────────────────

type DetailTab = "reports" | "collections" | "inquiries" | "sessions" | "overview" | "payments" | "notes";

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: userResponse, isLoading, isFetching, error, refetch } = useUserDetails(id as string);
  const user = useMemo(() => userResponse?.data || null, [userResponse]);

  const { data: currentUserRes } = useCurrentUser();
  const currentUser = currentUserRes?.data || currentUserRes;
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.isOwner;
  const canViewUsers = isSuperAdmin || Boolean(currentUser?.canViewUserDetails);
  const isCustomerSupport = currentUser?.role === "customer_support";

  // Active Team Presence & Collision Detection
  const { collisions } = useTeamPresence(id as string, "User");

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<DetailTab>("reports");

  const handleImpersonate = async () => {
    if (!user) return;
    try {
      const res = await adminApi.impersonateUser(user.id);
      localStorage.setItem("impersonated_user", user.name || user.email);
      localStorage.setItem("impersonated_token", res.data?.token);
      toast.success(`Safe Impersonation Mode active for ${user.name || user.email}`);
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start impersonation");
    }
  };

  // Query live contact messages from this user
  const userQueryParams = useMemo(() => {
    return {
      search: user?.email || undefined,
      limit: 100,
    };
  }, [user?.email]);

  const { data: userQueriesRes } = useGetAllQueries(userQueryParams);
  const userInquiries: ContactQuery[] = useMemo(() => {
    const fromApi = userQueriesRes?.data || [];
    const fromUser = user?.contactQueries || [];
    const map = new Map<string, ContactQuery>();
    fromUser.forEach((q: any) => map.set(q.id, q));
    fromApi.forEach((q: any) => map.set(q.id, q));
    return Array.from(map.values());
  }, [userQueriesRes?.data, user?.contactQueries]);

  const userEngagement = useMemo(() => ({
    totalReports: user?.reports?.length || 0,
    totalCollections: user?.collections?.length || 0,
    lastActive: user?.lastActiveAt || "N/A"
  }), [user]);

  // Modals state
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<ContactQuery | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryReplyMessage, setInquiryReplyMessage] = useState("");
  const [inquiryCustomSubject, setInquiryCustomSubject] = useState("");

  // Moderation state
  const [blockDurationDays, setBlockDurationDays] = useState<number>(7);
  const [blockCustomDate, setBlockCustomDate] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("");
  const [deleteReason, setDeleteReason] = useState<string>("");
  const [immediateHardDelete, setImmediateHardDelete] = useState<boolean>(false);
  const [flagAction, setFlagAction] = useState<"BLOCK" | "DELETE">("BLOCK");
  const [flagReason, setFlagReason] = useState<string>("");
  const [flagNote, setFlagNote] = useState<string>("");

  // Subscription Grant & Revoke state
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantPlan, setGrantPlan] = useState<"1_month" | "3_months" | "6_months" | "1_year" | "custom" | "lifetime">("1_month");
  const [grantCustomEndDate, setGrantCustomEndDate] = useState<string>("");
  const [grantReason, setGrantReason] = useState<string>("");
  const [grantBillingCycle, setGrantBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState<string>("");

  // Report inspection modal state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Email form state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // ─── TAB 1: REPORTS SEARCH / FILTER / SORT / PAGINATION STATE ──────────────
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [reportSort, setReportSort] = useState<string>("newest");
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportPageSize, setReportPageSize] = useState<number>(10);

  // ─── TAB 2: COLLECTIONS SEARCH / SORT / EXPAND STATE ───────────────────────
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<string>("all");
  const [collectionSort, setCollectionSort] = useState<string>("newest");
  const [collectionPage, setCollectionPage] = useState(1);
  const [collectionPageSize, setCollectionPageSize] = useState(6);
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});

  // ─── TAB 3: INQUIRIES SEARCH / FILTER / SORT / PAGINATION STATE ────────────
  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>("all");
  const [inquiryPriorityFilter, setInquiryPriorityFilter] = useState<string>("all");
  const [inquirySort, setInquirySort] = useState<string>("newest");
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryPageSize, setInquiryPageSize] = useState(6);

  // ─── TAB 4: PAYMENTS SEARCH / FILTER / SORT / PAGINATION STATE ─────────────
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentSort, setPaymentSort] = useState<string>("newest");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(6);

  // ─── TAB 5: SESSIONS SEARCH / PAGINATION STATE ─────────────────────────────
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState<number>(1);
  const [sessionPageSize, setSessionPageSize] = useState<number>(10);

  // Mutations
  const { mutateAsync: sendAdminMail, isPending: isSendingMail } = useSendAdminMail();
  const replyMutation = useReplyQuery(activeInquiry?.id || "");
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const softDeleteMutation = useSoftDeleteUser();
  const restoreMutation = useRestoreUser();
  const flagMutation = useFlagUser();
  const resolveFlagMutation = useResolveFlag();
  const grantAccessMutation = useGrantUserAccess();
  const revokeAccessMutation = useRevokeUserAccess();

  const handleCopyText = (text: string, type: "id" | "email") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  const handleOpenDirectMessage = () => {
    setEmailSubject("");
    setEmailMessage("");
    setMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!user?.email || !emailSubject.trim() || !emailMessage.trim()) return;

    try {
      await sendAdminMail({
        email: user.email,
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });
      toast.success(`Email sent successfully to ${user.email}`);
      setMessageModalOpen(false);
      setEmailSubject("");
      setEmailMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleOpenInquiryDetails = (query: ContactQuery) => {
    setActiveInquiry(query);
    setInquiryCustomSubject(`Re: ${query.subject}`);
    setInquiryReplyMessage("");
    setInquiryModalOpen(true);
  };

  const handleSendInquiryReply = async () => {
    if (!activeInquiry || !inquiryReplyMessage.trim()) return;

    try {
      await replyMutation.mutateAsync({
        replyMessage: inquiryReplyMessage.trim(),
        customSubject: inquiryCustomSubject.trim() || undefined,
      });
      setInquiryReplyMessage("");
      setInquiryModalOpen(false);
      refetch();
    } catch {
      // Handled by hook
    }
  };

  // Moderation Handlers
  const handleSoftBlockConfirm = async () => {
    if (!user) return;

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
        id: user.id,
        blockedUntil: targetDate.toISOString(),
        reason: blockReason.trim() || undefined,
      });
      setBlockModalOpen(false);
      setBlockReason("");
      setBlockCustomDate("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleUnblock = async () => {
    if (!user) return;
    try {
      await unblockMutation.mutateAsync(user.id);
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user) return;

    try {
      await softDeleteMutation.mutateAsync({
        id: user.id,
        reason: deleteReason.trim() || undefined,
        immediateHardDelete,
      });
      setDeleteModalOpen(false);
      setDeleteReason("");
      if (immediateHardDelete) {
        router.replace("/dashboard/users");
      } else {
        refetch();
      }
    } catch {
      // Handled by hook
    }
  };

  const handleRestoreAccount = async () => {
    if (!user) return;
    try {
      await restoreMutation.mutateAsync(user.id);
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleFlagConfirm = async () => {
    if (!user || !flagReason.trim()) return;

    try {
      await flagMutation.mutateAsync({
        id: user.id,
        action: flagAction,
        reason: flagReason.trim(),
        note: flagNote.trim() || undefined,
      });
      setFlagModalOpen(false);
      setFlagReason("");
      setFlagNote("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleResolveFlag = async (flagId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await resolveFlagMutation.mutateAsync({ flagId, status });
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleGrantAccessConfirm = async () => {
    if (!user) return;
    if (grantPlan === "custom" && !grantCustomEndDate) {
      toast.error("Please pick a custom end date");
      return;
    }
    try {
      await grantAccessMutation.mutateAsync({
        userId: user.id,
        plan: grantPlan,
        customEndDate: grantPlan === "custom" ? new Date(grantCustomEndDate).toISOString() : undefined,
        reason: grantReason.trim() || undefined,
        billingCycle: grantBillingCycle,
      });
      setGrantModalOpen(false);
      setGrantReason("");
      setGrantCustomEndDate("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const handleRevokeAccessConfirm = async () => {
    if (!user) return;
    try {
      await revokeAccessMutation.mutateAsync({
        userId: user.id,
        reason: revokeReason.trim() || undefined,
      });
      setRevokeModalOpen(false);
      setRevokeReason("");
      refetch();
    } catch {
      // Handled by hook
    }
  };

  const toggleExpandCollection = (colId: string) => {
    setExpandedCollections(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  // ─── Filtered & Sorted Datasets ────────────────────────────────────────────

  const rawReports = useMemo(() => user?.reports || [], [user?.reports]);
  const rawCollections = useMemo(() => user?.collections || [], [user?.collections]);
  const rawPayments = useMemo(() => user?.payments || [], [user?.payments]);
  const rawFlags = useMemo(() => user?.flags || [], [user?.flags]);

  const isSoftBlocked = Boolean(user?.blockedUntil && new Date(user.blockedUntil) > new Date());
  const isSoftDeleted = Boolean(user?.isDeleted);
  const pendingFlags = useMemo(() => rawFlags.filter((f: any) => f.status === "PENDING"), [rawFlags]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return rawReports
      .filter((r: any) => {
        if (reportStatusFilter !== "all" && r.status !== reportStatusFilter) return false;
        if (reportTypeFilter !== "all" && r.type !== reportTypeFilter) return false;
        if (reportSearch.trim()) {
          const q = reportSearch.toLowerCase();
          const matchAddress = r.address?.toLowerCase().includes(q);
          const matchId = r.id?.toLowerCase().includes(q);
          const matchOverview = r.overview?.toLowerCase().includes(q);
          const matchAusp = r.auspiciousnessLevel?.toLowerCase().includes(q);
          if (!matchAddress && !matchId && !matchOverview && !matchAusp) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (reportSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (reportSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (reportSort === "score_high") return (b.overallScore || 0) - (a.overallScore || 0);
        if (reportSort === "score_low") return (a.overallScore || 0) - (b.overallScore || 0);
        if (reportSort === "address_asc") return (a.address || "").localeCompare(b.address || "");
        return 0;
      });
  }, [rawReports, reportSearch, reportStatusFilter, reportTypeFilter, reportSort]);

  const paginatedReports = useMemo(() => {
    const start = (reportPage - 1) * reportPageSize;
    return filteredReports.slice(start, start + reportPageSize);
  }, [filteredReports, reportPage, reportPageSize]);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return rawCollections
      .filter((c: any) => {
        if (collectionTypeFilter !== "all" && c.type !== collectionTypeFilter) return false;
        if (collectionSearch.trim()) {
          const q = collectionSearch.toLowerCase();
          const matchName = c.name?.toLowerCase().includes(q);
          const matchDesc = c.description?.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (collectionSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (collectionSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (collectionSort === "name_asc") return (a.name || "").localeCompare(b.name || "");
        if (collectionSort === "count_high") return (b.reports?.length || 0) - (a.reports?.length || 0);
        return 0;
      });
  }, [rawCollections, collectionSearch, collectionTypeFilter, collectionSort]);

  const paginatedCollections = useMemo(() => {
    const start = (collectionPage - 1) * collectionPageSize;
    return filteredCollections.slice(start, start + collectionPageSize);
  }, [filteredCollections, collectionPage, collectionPageSize]);

  // Filtered Inquiries
  const filteredInquiries = useMemo(() => {
    return userInquiries
      .filter(q => {
        if (inquiryStatusFilter !== "all" && q.status !== inquiryStatusFilter) return false;
        if (inquiryPriorityFilter !== "all" && q.priority !== inquiryPriorityFilter) return false;
        if (inquirySearch.trim()) {
          const s = inquirySearch.toLowerCase();
          const matchSubject = q.subject?.toLowerCase().includes(s);
          const matchMsg = q.message?.toLowerCase().includes(s);
          const matchReply = q.replyMessage?.toLowerCase().includes(s);
          if (!matchSubject && !matchMsg && !matchReply) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (inquirySort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (inquirySort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return 0;
      });
  }, [userInquiries, inquirySearch, inquiryStatusFilter, inquiryPriorityFilter, inquirySort]);

  const paginatedInquiries = useMemo(() => {
    const start = (inquiryPage - 1) * inquiryPageSize;
    return filteredInquiries.slice(start, start + inquiryPageSize);
  }, [filteredInquiries, inquiryPage, inquiryPageSize]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return rawPayments
      .filter((p: any) => {
        if (paymentStatusFilter !== "all" && (p.status || "").toLowerCase() !== paymentStatusFilter.toLowerCase()) return false;
        if (paymentSearch.trim()) {
          const s = paymentSearch.toLowerCase();
          const matchId = p.id?.toLowerCase().includes(s);
          const matchCurr = p.currency?.toLowerCase().includes(s);
          if (!matchId && !matchCurr) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (paymentSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (paymentSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (paymentSort === "amount_high") return Number(b.amount || 0) - Number(a.amount || 0);
        if (paymentSort === "amount_low") return Number(a.amount || 0) - Number(b.amount || 0);
        return 0;
      });
  }, [rawPayments, paymentSearch, paymentStatusFilter, paymentSort]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, paymentPage, paymentPageSize]);

  // ─── SESSIONS & ENGAGEMENT DATA DERIVATION ─────────────────────────────────
  const rawSessions = useMemo(() => user?.sessions || [], [user?.sessions]);
  const engagement = useMemo(() => user?.engagement || null, [user?.engagement]);

  const filteredSessions = useMemo(() => {
    return rawSessions.filter((s: any) => {
      if (sessionSearch.trim()) {
        const q = sessionSearch.toLowerCase();
        const matchIp = (s.ipAddress || "").toLowerCase().includes(q);
        const matchBrowser = (s.browser || "").toLowerCase().includes(q);
        const matchOs = (s.os || "").toLowerCase().includes(q);
        const matchDevice = (s.device || "").toLowerCase().includes(q);
        if (!matchIp && !matchBrowser && !matchOs && !matchDevice) return false;
      }
      return true;
    });
  }, [rawSessions, sessionSearch]);

  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionPageSize;
    return filteredSessions.slice(start, start + sessionPageSize);
  }, [filteredSessions, sessionPage, sessionPageSize]);

  const avgReportScore = useMemo(() => {
    if (!rawReports.length) return null;
    const scores = rawReports.map((r: any) => r.overallScore).filter((s: any) => typeof s === "number");
    if (!scores.length) return null;
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }, [rawReports]);

  const totalSpentFormatted = useMemo(() => {
    if (!rawPayments.length) return "$0.00";
    const totalCents = rawPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    return `$${(totalCents / 100).toFixed(2)}`;
  }, [rawPayments]);

  if (isLoading) return <SkeletonLoader />;

  // ─── Access Control Guard ─────────────────────────────────────────────────
  if (!canViewUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center px-4 max-w-lg mx-auto">
        <div className="h-20 w-20 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 mb-5 shadow-lg">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Restricted Privilege Area
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Viewing detailed user accounts, generated reports, collections, and billing history is restricted exclusively to <strong>Super Admins</strong> and staff members with granted viewing privileges.
        </p>
        <div className="flex items-center gap-3 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl px-5 h-9 text-xs font-semibold"
          >
            Go Back
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="rounded-xl px-5 h-9 text-xs font-semibold shadow-xs"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          User Account Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested user account may have been permanently removed or does not exist on the platform.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/users")}
          className="rounded-xl mt-3 text-xs font-semibold"
        >
          Return to Users Directory
        </Button>
      </div>
    );
  }

  const isGuest = Boolean(user.isGuest);
  const isPaid = Boolean(user.isPaid);
  const isOtpVerified = Boolean(user.isOtpVerified);
  const status = user.status || "free";
  const userPersona = formatPersonaRole(user.userRole);
  const daysUntilPurge = getDaysRemaining(user.purgeAt);

  return (
    <section className="w-full flex flex-col gap-6 min-h-screen pb-20">
      {/* ─── REAL-TIME TEAM COLLISION WARNING ─────────────────────────────── */}
      {collisions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <p className="text-xs font-semibold">
              <strong>Active Team Presence:</strong> {collisions.map(c => c.name || c.email).join(', ')} is also viewing this profile.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
            Live Collision Guard
          </span>
        </div>
      )}

      {/* ─── MODERATION STATUS BANNERS ─────────────────────────────────────── */}

      {/* 1. Soft-Deleted Account Banner */}
      {isSoftDeleted && (
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in-50">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-rose-900 dark:text-rose-100">
                  Account Soft-Deleted (60-Day Recovery Period)
                </span>
                <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                  Auto-Purge in {daysUntilPurge} Days
                </Badge>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                Deleted on {formatDate(user.deletedAt)} by <strong>{user.deletedBy || "Administrator"}</strong>. Reason: {user.deleteReason || "Standard deletion"}. All reports and data will be permanently wiped on <strong>{formatDate(user.purgeAt)}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              onClick={handleRestoreAccount}
              disabled={restoreMutation.isPending}
              className="rounded-xl h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Account</span>
            </Button>
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImmediateHardDelete(true);
                  setDeleteModalOpen(true);
                }}
                className="rounded-xl h-8.5 px-3 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 text-xs font-semibold"
              >
                <span>Purge Now</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. Soft-Blocked Account Banner */}
      {!isSoftDeleted && isSoftBlocked && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Ban className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-amber-900 dark:text-amber-100">
                  Account Soft-Blocked / Suspended
                </span>
                <Badge className="bg-amber-600 text-white font-bold text-[10px]">
                  Until {formatDate(user.blockedUntil)}
                </Badge>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Reason: {user.blockReason || "Account temporarily suspended by administration"}. The user cannot authenticate or access features while blocked.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              onClick={handleUnblock}
              disabled={unblockMutation.isPending}
              className="rounded-xl h-8.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Unblock Account</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Pending Moderation Flags Banner */}
      {pendingFlags.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-100 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flag className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Moderation Flag Submitted by Staff ({pendingFlags.length} Pending Review)
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {pendingFlags.map((flag: any) => (
              <div
                key={flag.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-slate-800 dark:bg-slate-700 text-white font-medium text-[10px]">
                      Action: {flag.action || "BLOCK"}
                    </Badge>
                    <span className="text-slate-600 dark:text-slate-300">
                      Flagged by <strong>{flag.flaggedBy?.name || flag.flaggedBy?.email || "Staff Admin"}</strong> ({cap(flag.flaggedBy?.role || "admin")})
                    </span>
                    <span className="text-slate-400">• {formatTimeAgo(flag.createdAt)}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Reason: {flag.reason}
                  </p>
                  {flag.note && (
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      Staff Note: "{flag.note}"
                    </p>
                  )}
                </div>

                {isSuperAdmin ? (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      onClick={() => handleResolveFlag(flag.id, "APPROVED")}
                      disabled={resolveFlagMutation.isPending}
                      className="rounded-lg h-7.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[11px] gap-1"
                    >
                      <Check className="h-3 w-3" />
                      <span>Approve & Execute</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveFlag(flag.id, "REJECTED")}
                      disabled={resolveFlagMutation.isPending}
                      className="rounded-lg h-7.5 px-2.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-[11px]"
                    >
                      <span>Dismiss Flag</span>
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold italic">
                    Under Super Admin Review
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Breadcrumb & Action Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/dashboard/users")}
            className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Users Directory</span>
          </button>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold truncate max-w-[200px]">
            {user.name || user.email}
          </span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Impersonate User (Super Admin Only) */}
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImpersonate}
              className="h-8.5 px-3 rounded-xl text-xs gap-1.5 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Impersonate</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDirectMessage}
            className="h-8.5 px-3 rounded-xl text-xs gap-1.5 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </Button>

          {/* Grant / Manage Subscription Access Button */}
          {user.isPaid ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeModalOpen(true)}
              className="h-8.5 px-3 rounded-xl text-xs gap-1.5 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span>Manage Subscription</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGrantModalOpen(true)}
              className="h-8.5 px-3 rounded-xl text-xs gap-1.5 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span>Grant Subscription</span>
            </Button>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 px-3 rounded-xl text-xs gap-1.5 font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span>Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 shadow-lg text-xs">
              <DropdownMenuItem
                onClick={() => setFlagModalOpen(true)}
                className="gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Flag User for Review</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isSoftBlocked ? (
                <DropdownMenuItem
                  onClick={handleUnblock}
                  disabled={unblockMutation.isPending}
                  className="gap-2 cursor-pointer font-medium text-emerald-600"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Unblock Account</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setBlockModalOpen(true)}
                  className="gap-2 cursor-pointer font-medium text-amber-600"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Suspend Account</span>
                </DropdownMenuItem>
              )}

              {isSoftDeleted ? (
                <DropdownMenuItem
                  onClick={handleRestoreAccount}
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
                      setImmediateHardDelete(false);
                      setDeleteModalOpen(true);
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
      </div>

      {/* ─── Hero Profile Header Card ──────────────────────────────────────── */}
      <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div className="flex items-start sm:items-center gap-5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm overflow-hidden">
                {user.profilePictureURL ? (
                  <Image
                    src={user.profilePictureURL}
                    alt={user.name || "User Avatar"}
                    className="h-full w-full object-cover"
                    width={80}
                    height={80}
                  />
                ) : (
                  getInitials(user.name || user.email || "??")
                )}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  isSoftDeleted
                    ? "bg-rose-600"
                    : isSoftBlocked
                    ? "bg-amber-600"
                    : isPaid
                    ? "bg-emerald-500"
                    : isGuest
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
              />
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {user.name || "Anonymous Platform User"}
                </h1>

                {isOtpVerified && (
                  <span title="OTP Verified" className="inline-flex items-center text-sky-500">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                )}

                {user.role && user.role !== "user" && (
                  <Badge
                    variant="outline"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs py-0.5 px-2"
                  >
                    {cap(user.role)}
                  </Badge>
                )}

                {user.userRole && (
                  <Badge
                    variant="outline"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-xs font-medium py-0.5 px-2"
                  >
                    {userPersona}
                  </Badge>
                )}

                {isSoftDeleted ? (
                  <Badge variant="destructive" className="text-xs font-medium py-0.5 px-2">
                    Soft-Deleted ({daysUntilPurge}d left)
                  </Badge>
                ) : isSoftBlocked ? (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-medium py-0.5 px-2">
                    Suspended
                  </Badge>
                ) : user.adminGrantedAccess ? (
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs font-medium py-0.5 px-2">
                    Admin Grant
                  </Badge>
                ) : isPaid ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium py-0.5 px-2">
                    Paid {cap(user.billingCycle)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-xs font-medium py-0.5 px-2">
                    Free Tier
                  </Badge>
                )}
              </div>

              {/* Email & ID & IP Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleCopyText(user.email || "", "email")}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{user.email}</span>
                  {copiedEmail ? (
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
                  )}
                </button>

                <span>•</span>

                <button
                  type="button"
                  onClick={() => handleCopyText(user.id, "id")}
                  className="flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-primary transition-colors group"
                  title="Click to copy User ID"
                >
                  <span>ID: {user.id}</span>
                  {copiedId ? (
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                  )}
                </button>

                {(user.lastActiveIp || user.guestIp) && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const ip = user.lastActiveIp || user.guestIp || "";
                        navigator.clipboard.writeText(ip);
                        setCopiedIp(ip);
                        setTimeout(() => setCopiedIp(null), 2000);
                        toast.success("IP copied to clipboard!");
                      }}
                      className="flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-primary transition-colors group"
                      title="Click to copy Last Active IP"
                    >
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span>IP: {user.lastActiveIp || user.guestIp}</span>
                      {copiedIp === (user.lastActiveIp || user.guestIp) ? (
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </>
                )}

                <span>•</span>

                <span className="text-[11.5px] text-slate-400">
                  Registered {formatTimeAgo(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge Ribbon inside Hero */}
          <div className="flex items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 flex-wrap">
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Avg Score</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {avgReportScore !== null ? `${avgReportScore}/100` : "—"}
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Total Spent</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {totalSpentFormatted}
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Total Logins</p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {engagement?.totalLogins ?? user.loginCount ?? rawSessions.length ?? 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Ribbon (5-column matching dashboard) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`rounded-2xl border p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 text-left transition-all group cursor-pointer ${
            activeTab === "reports"
              ? "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inspection Reports</p>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
              <FileBarChart2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {user._count?.reports ?? rawReports.length}
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">property audits</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("collections")}
          className={`rounded-2xl border p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 text-left transition-all group cursor-pointer ${
            activeTab === "collections"
              ? "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Saved Collections</p>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold shrink-0">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {user._count?.collections ?? rawCollections.length}
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">bookmarks & folders</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`rounded-2xl border p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 text-left transition-all group cursor-pointer ${
            activeTab === "payments"
              ? "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Transactions</p>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {user._count?.payments ?? rawPayments.length}
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">invoices & plans</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`rounded-2xl border p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 text-left transition-all group cursor-pointer ${
            activeTab === "inquiries"
              ? "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Support Inquiries</p>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
              <MailQuestion className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {userInquiries.length || user._count?.contactQueries || 0}
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">messages & tickets</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`rounded-2xl border p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 text-left transition-all group cursor-pointer ${
            activeTab === "sessions"
              ? "bg-primary/5 border-primary/40 ring-2 ring-primary/20"
              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sessions & IPs</p>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold shrink-0">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {rawSessions.length || user.loginCount || 1}
            </p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">active devices</p>
          </div>
        </button>
      </div>

      {/* ─── Navigation Sub-Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto [scrollbar-width:none] text-xs">
        {[
          { id: "reports", label: `Generated Reports (${rawReports.length})`, icon: FileBarChart2 },
          { id: "collections", label: `Saved Collections (${rawCollections.length})`, icon: FolderKanban },
          { id: "inquiries", label: `Support Inquiries (${userInquiries.length})`, icon: MessageSquare },
          { id: "overview", label: "Account Identity & Security", icon: User },
          { id: "payments", label: `Transactions & Invoices (${rawPayments.length})`, icon: CreditCard },
          { id: "notes", label: "Private Staff Notes", icon: Lock },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as DetailTab)}
              className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: GENERATED INSPECTION REPORTS ─────────────────────────────── */}
      {activeTab === "reports" && (
        <SectionCard
          title="Generated Inspection Reports"
          subtitle={`All property inspection, defect analyses, and Feng Shui audits created by ${user.name || user.email}`}
          icon={FileBarChart2}
          badge={
            <Badge variant="outline" className="text-xs font-semibold">
              {filteredReports.length} of {rawReports.length} Reports
            </Badge>
          }
        >
          {/* Search, Filter & Sort Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={reportSearch}
                onChange={e => {
                  setReportSearch(e.target.value);
                  setReportPage(1);
                }}
                placeholder="Search reports by address, notes, ID..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {reportSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch("");
                    setReportPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={reportStatusFilter}
                  onChange={e => {
                    setReportStatusFilter(e.target.value);
                    setReportPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <select
                  value={reportTypeFilter}
                  onChange={e => {
                    setReportTypeFilter(e.target.value);
                    setReportPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-Site</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={reportSort}
                  onChange={e => setReportSort(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score_high">Score: High to Low</option>
                  <option value="score_low">Score: Low to High</option>
                  <option value="address_asc">Address (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          {paginatedReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedReports.map((r: any) => {
                const typeLabel = r.type === "PROPERTY_REPORT"
                  ? "Property Report"
                  : r.type
                  ? cap(String(r.type).replace(/_/g, " "))
                  : "Inspection";

                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                            {r.address || `Inspection #${r.id.slice(0, 8)}`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {getReportStatusBadge(r.status)}
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                              {typeLabel}
                            </span>
                          </div>
                        </div>

                        {r.overallScore !== null && r.overallScore !== undefined && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                            <span className="text-[11px] text-slate-400">Score</span>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{r.overallScore}</span>
                            <span className="text-[10px] text-slate-400">/100</span>
                          </div>
                        )}
                      </div>

                      {r.overview ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {r.overview}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No overview provided.</p>
                      )}

                      {r.auspiciousnessLevel && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Compass className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Feng Shui: {r.auspiciousnessLevel}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{formatDate(r.createdAt)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(r);
                          setReportModalOpen(true);
                        }}
                        className="h-8 px-3 rounded-xl text-xs font-medium gap-1 text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect Details</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
              <FileBarChart2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching inspection reports found.
              </p>
            </div>
          )}

          {/* Pagination */}
          <PaginationBar
            currentPage={reportPage}
            totalItems={filteredReports.length}
            pageSize={reportPageSize}
            onPageChange={setReportPage}
            onPageSizeChange={size => {
              setReportPageSize(size);
              setReportPage(1);
            }}
          />
        </SectionCard>
      )}

      {/* ─── TAB 2: SAVED COLLECTIONS ───────────────────────────────────────── */}
      {activeTab === "collections" && (
        <SectionCard
          title="Saved Inspection Collections"
          subtitle={`Custom property collections organized by ${user.name || user.email}`}
          icon={FolderKanban}
          badge={
            <Badge variant="outline" className="text-xs font-semibold">
              {filteredCollections.length} of {rawCollections.length} Collections
            </Badge>
          }
        >
          {/* Search & Sort Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={collectionSearch}
                onChange={e => {
                  setCollectionSearch(e.target.value);
                  setCollectionPage(1);
                }}
                placeholder="Search collections by name or description..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {collectionSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCollectionSearch("");
                    setCollectionPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <select
                  value={collectionTypeFilter}
                  onChange={e => {
                    setCollectionTypeFilter(e.target.value);
                    setCollectionPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-Site</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={collectionSort}
                  onChange={e => setCollectionSort(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="count_high">Most Reports</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collections List */}
          {paginatedCollections.length > 0 ? (
            <div className="space-y-4">
              {paginatedCollections.map((c: any) => {
                const isExpanded = Boolean(expandedCollections[c.id]);
                const reportsInCol = c.reports || [];

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:bg-white dark:hover:bg-slate-850/80 transition-all space-y-3.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {c.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {c.type || "Remote"}
                          </Badge>
                          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10.5px] font-bold">
                            {reportsInCol.length} Reports
                          </Badge>
                        </div>
                        {c.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 font-medium mr-1">
                          {formatDate(c.updatedAt || c.createdAt)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpandCollection(c.id)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5"
                        >
                          <span>{isExpanded ? "Hide Reports" : "View Reports"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Nested Reports Accordion */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 animate-in fade-in-50 duration-200">
                        {reportsInCol.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {reportsInCol.map((item: any) => {
                              const rep = item.report;
                              if (!rep) return null;
                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {rep.address || `Report #${rep.id.slice(0, 8)}`}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                                      {rep.overallScore !== null && rep.overallScore !== undefined && (
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                          Score: {rep.overallScore}/100
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span>{formatDate(rep.createdAt)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {getReportStatusBadge(rep.status)}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedReport(rep);
                                        setReportModalOpen(true);
                                      }}
                                      className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-primary"
                                      title="Inspect Report"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">
                            This collection does not contain any reports yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
              <FolderKanban className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching collections found.
              </p>
            </div>
          )}

          {/* Pagination */}
          <PaginationBar
            currentPage={collectionPage}
            totalItems={filteredCollections.length}
            pageSize={collectionPageSize}
            onPageChange={setCollectionPage}
            onPageSizeChange={size => {
              setCollectionPageSize(size);
              setCollectionPage(1);
            }}
          />
        </SectionCard>
      )}

      {/* ─── TAB 3: SUPPORT INQUIRIES & MESSAGES ──────────────────────────────── */}
      {activeTab === "inquiries" && (
        <SectionCard
          title="User Messages & Support Cases"
          subtitle={`Support inquiries and direct feedback sent by ${user.email}`}
          icon={MessageSquare}
          badge={
            <Badge variant="outline" className="text-xs font-semibold">
              {filteredInquiries.length} of {userInquiries.length} Inquiries
            </Badge>
          }
          action={
            <Button
              size="sm"
              onClick={handleOpenDirectMessage}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
            >
              <Send className="h-3 w-3" />
              <span>Compose Email</span>
            </Button>
          }
        >
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={inquirySearch}
                onChange={e => {
                  setInquirySearch(e.target.value);
                  setInquiryPage(1);
                }}
                placeholder="Search messages by subject or content..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {inquirySearch && (
                <button
                  type="button"
                  onClick={() => {
                    setInquirySearch("");
                    setInquiryPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <select
                  value={inquiryStatusFilter}
                  onChange={e => {
                    setInquiryStatusFilter(e.target.value);
                    setInquiryPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <select
                  value={inquiryPriorityFilter}
                  onChange={e => {
                    setInquiryPriorityFilter(e.target.value);
                    setInquiryPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={inquirySort}
                  onChange={e => setInquirySort(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inquiries List */}
          {paginatedInquiries.length > 0 ? (
            <div className="space-y-3">
              {paginatedInquiries.map(q => (
                <div
                  key={q.id}
                  onClick={() => handleOpenInquiryDetails(q)}
                  className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-primary/40 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group shadow-2xs"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                        {q.subject}
                      </span>
                      {getPriorityBadge(q.priority)}
                      {getStatusBadge(q.status)}
                      {q.replyMessage && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          ✓ Replied
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {q.message}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                      <span>Received {formatTimeAgo(q.createdAt)}</span>
                      {q.assignedToName && (
                        <>
                          <span>•</span>
                          <span>Assigned to: <strong>{q.assignedToName}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 gap-1.5"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      <span>View & Reply</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
              <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching support messages found.
              </p>
            </div>
          )}

          {/* Pagination */}
          <PaginationBar
            currentPage={inquiryPage}
            totalItems={filteredInquiries.length}
            pageSize={inquiryPageSize}
            onPageChange={setInquiryPage}
            onPageSizeChange={size => {
              setInquiryPageSize(size);
              setInquiryPage(1);
            }}
          />
        </SectionCard>
      )}

      {/* ─── TAB 4: IDENTITY, BILLING & SECURITY ────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CARD 1: Identity & Account */}
          <SectionCard
            title="Account & Identity"
            subtitle="Core user registration details"
            icon={User}
            badge={
              <Badge variant="outline" className="text-[10.5px]">
                Auth: {cap(user.authProvider)}
              </Badge>
            }
          >
            <div className="space-y-0.5">
              <DetailRow label="Full Name" value={user.name || "—"} icon={User} />
              <DetailRow label="Email Address" value={user.email} icon={Mail} copyable />
              <DetailRow
                label="User Persona / Industry"
                value={userPersona}
                icon={Briefcase}
              />
              <DetailRow
                label="Account Role"
                value={cap(user.role)}
                icon={Shield}
              />
              <DetailRow
                label="OTP Verified"
                icon={ShieldCheck}
                badge={
                  isOtpVerified ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/20 text-[10px]">
                      Unverified
                    </Badge>
                  )
                }
              />
              <DetailRow
                label="Terms & Conditions"
                icon={BadgeCheck}
                badge={
                  user.termsAndConditions ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                      Accepted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 text-[10px]">
                      Not Accepted
                    </Badge>
                  )
                }
              />
            </div>
          </SectionCard>

          {/* CARD 2: Subscription & Billing */}
          <SectionCard
            title="Subscription & Billing"
            subtitle="Platform subscription, tier & administrative access grants"
            icon={CreditCard}
            badge={
              user.adminGrantedAccess ? (
                <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-bold gap-1">
                  <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  Admin-Granted
                </Badge>
              ) : (
                <Badge
                  className={
                    isPaid
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]"
                  }
                >
                  {isPaid ? "Active Stripe Subscription" : "Free Tier"}
                </Badge>
              )
            }
          >
            <div className="space-y-0.5">
              <DetailRow
                label="Subscription Status"
                value={user.adminGrantedAccess ? "Active (Admin Granted)" : cap(status)}
                icon={CheckCircle2}
              />
              <DetailRow
                label="Plan / Billing Cycle"
                value={user.currentPeriodEnd && user.currentPeriodEnd > 4000000000 ? "Lifetime Access" : cap(user.billingCycle)}
                icon={RefreshCw}
              />
              <DetailRow
                label="Access Expiration"
                value={
                  user.currentPeriodEnd
                    ? user.currentPeriodEnd > 4000000000
                      ? "Never Expires (Lifetime Access)"
                      : formatDate(user.currentPeriodEnd)
                    : isPaid
                    ? "Active"
                    : "No active access"
                }
                icon={Calendar}
              />

              {user.adminGrantedAccess && (
                <>
                  <DetailRow
                    label="Granted By"
                    value={user.adminGrantedBy || "Administrator"}
                    icon={ShieldCheck}
                  />
                  {user.adminGrantedReason && (
                    <DetailRow
                      label="Grant Reason / Note"
                      value={user.adminGrantedReason}
                      icon={FileText}
                    />
                  )}
                  {user.adminGrantedAt && (
                    <DetailRow
                      label="Granted On"
                      value={formatDate(user.adminGrantedAt)}
                      icon={Clock}
                    />
                  )}
                </>
              )}

              {user.stripeCustomerId && (
                <DetailRow
                  label="Stripe Customer ID"
                  value={user.stripeCustomerId}
                  icon={CreditCard}
                  mono
                  copyable
                />
              )}
              {user.stripeSubscriptionId && (
                <DetailRow
                  label="Subscription ID"
                  value={user.stripeSubscriptionId}
                  icon={RefreshCw}
                  mono
                  copyable
                />
              )}

              {/* Action Buttons inside Card */}
              <div className="pt-3 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800 mt-2">
                {isPaid ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setGrantModalOpen(true)}
                      className="rounded-xl h-8 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span>{user.adminGrantedAccess ? "Modify Access Duration" : "Grant Admin Access"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRevokeModalOpen(true)}
                      className="rounded-xl h-8 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 shadow-2xs"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Revoke Access</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setGrantModalOpen(true)}
                    className="rounded-xl h-8 px-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span>Grant Subscription Access</span>
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* CARD 3: Session & Device Security */}
          <SectionCard
            title="Security & Moderation Status"
            subtitle="Client fingerprint, block duration and lifecycle status"
            icon={Cpu}
            badge={
              isSoftDeleted ? (
                <Badge variant="destructive" className="text-[10px]">
                  Soft-Deleted
                </Badge>
              ) : isSoftBlocked ? (
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                  Suspended
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                  Active & Healthy
                </Badge>
              )
            }
          >
            <div className="space-y-0.5">
              <DetailRow
                label="Account Type"
                value={isGuest ? "Guest Visitor" : "Registered User"}
                icon={isGuest ? UserX : UserCheck}
              />
              <DetailRow
                label="Soft-Block Status"
                icon={isSoftBlocked ? Ban : CheckCircle2}
                badge={
                  isSoftBlocked ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Blocked until {formatDate(user.blockedUntil)}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                      Not Blocked
                    </Badge>
                  )
                }
              />
              {user.blockReason && (
                <DetailRow label="Block Reason" value={user.blockReason} icon={AlertOctagon} />
              )}
              <DetailRow
                label="Soft-Deletion Status"
                icon={Trash2}
                badge={
                  isSoftDeleted ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Deleted (Purge in {daysUntilPurge}d)
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                      Active Account
                    </Badge>
                  )
                }
              />
              {user.deleteReason && (
                <DetailRow label="Delete Reason" value={user.deleteReason} icon={AlertOctagon} />
              )}
              <DetailRow
                label="Client IP Address"
                value={user.guestIp || "—"}
                icon={Globe}
                mono
                copyable
              />
              <DetailRow
                label="Device Fingerprint"
                value={user.guestDeviceId || "—"}
                icon={Cpu}
                mono
                copyable
              />
            </div>
          </SectionCard>

          {/* CARD 4: Activity & Timestamps */}
          <SectionCard
            title="Timestamps & Retention"
            subtitle="Chronological lifecycle timestamps"
            icon={Calendar}
          >
            <div className="space-y-0.5">
              <DetailRow
                label="Account Created"
                value={formatDate(user.createdAt)}
                icon={Calendar}
              />
              <DetailRow
                label="Last Profile Update"
                value={formatDate(user.updatedAt)}
                icon={Clock}
              />
              {user.deletedAt && (
                <DetailRow
                  label="Soft-Deleted At"
                  value={formatDate(user.deletedAt)}
                  icon={Trash2}
                />
              )}
              {user.purgeAt && (
                <DetailRow
                  label="Permanent Purge Date"
                  value={formatDate(user.purgeAt)}
                  icon={Clock}
                />
              )}
              <DetailRow
                label="Password Reset Pending"
                icon={AlertTriangle}
                badge={
                  user.isResetRequest ? (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                      Reset Requested
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 text-[10px]">
                      None
                    </Badge>
                  )
                }
              />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── TAB 5: PAYMENTS & INVOICES ─────────────────────────────────────── */}
      {activeTab === "payments" && (
        <SectionCard
          title="Payment Transactions & Invoices"
          subtitle={`Billing records and Stripe subscription payments for ${user.name || user.email}`}
          icon={Receipt}
          badge={
            <Badge variant="outline" className="text-xs font-semibold">
              {filteredPayments.length} of {rawPayments.length} Invoices
            </Badge>
          }
        >
          {/* Search, Filter & Sort Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={paymentSearch}
                onChange={e => {
                  setPaymentSearch(e.target.value);
                  setPaymentPage(1);
                }}
                placeholder="Search transactions by ID, currency..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {paymentSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSearch("");
                    setPaymentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <select
                  value={paymentStatusFilter}
                  onChange={e => {
                    setPaymentStatusFilter(e.target.value);
                    setPaymentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={paymentSort}
                  onChange={e => setPaymentSort(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_high">Highest Amount</option>
                  <option value="amount_low">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {paginatedPayments.length > 0 ? (
            <div className="space-y-3">
              {paginatedPayments.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {p.currency?.toUpperCase() || "USD"} ${(Number(p.amount) / 100 || 0).toFixed(2)}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10.5px] font-bold">
                        {cap(p.status || "Paid")}
                      </Badge>
                    </div>
                    <p className="font-mono text-[11px] text-slate-400">
                      Invoice ID: {p.id}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 self-end sm:self-center font-medium">
                    Processed {formatDate(p.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
              <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching transaction records found.
              </p>
            </div>
          )}

          {/* Pagination */}
          <PaginationBar
            currentPage={paymentPage}
            totalItems={filteredPayments.length}
            pageSize={paymentPageSize}
            onPageChange={setPaymentPage}
            onPageSizeChange={size => {
              setPaymentPageSize(size);
              setPaymentPage(1);
            }}
          />
        </SectionCard>
      )}

      {/* ─── TAB 6: SESSIONS & IP SECURITY LOG ──────────────────────────────── */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Engagement Tier */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Engagement Category
                </p>
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${
                      engagement?.tier === "power_user"
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                        : engagement?.tier === "active_regular"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                        : engagement?.tier === "occasional"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : engagement?.tier === "dormant"
                        ? "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    } text-xs font-bold py-0.5 px-2`}
                  >
                    {engagement?.tierLabel || "Explorer / Prospect"}
                  </Badge>
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-2">
                  Preferred type:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatPersonaRole(engagement?.favoriteReportType) || "Standard Inspection"}
                  </strong>
                </p>
              </div>
            </div>

            {/* Card 2: Report Velocity */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Report Velocity
                </p>
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 space-y-1">
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {engagement?.avgReportIntervalDays
                    ? `Every ~${engagement.avgReportIntervalDays}d`
                    : rawReports.length > 0
                    ? "Active generation"
                    : "No reports yet"}
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  {engagement?.reportsLast30Days ?? 0} in last 30d •{" "}
                  {engagement?.daysSinceLastReport !== null
                    ? engagement?.daysSinceLastReport === 0
                      ? "Latest: Today"
                      : `Latest: ${engagement?.daysSinceLastReport}d ago`
                    : "No activity"}
                </p>
              </div>
            </div>

            {/* Card 3: Total Logins */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Logins & Auth
                </p>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <History className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 space-y-1">
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {engagement?.totalLogins ?? user.loginCount ?? rawSessions.length ?? 1} Logins
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  Provider: <strong>{cap(user.authProvider || "Email/Password")}</strong>
                </p>
              </div>
            </div>

            {/* Card 4: IP & Session Duration */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Network & IPs
                </p>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 space-y-1">
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {engagement?.uniqueIpCount ?? 1} Distinct IP{engagement?.uniqueIpCount !== 1 ? "s" : ""}
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
                  Active IP: <span className="font-mono">{user.lastActiveIp || user.guestIp || "—"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Known IP Addresses Bar */}
          {engagement?.uniqueIps && engagement.uniqueIps.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <span>Recorded IP Addresses:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {engagement.uniqueIps.map((ip: string) => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(ip);
                      setCopiedIp(ip);
                      setTimeout(() => setCopiedIp(null), 2000);
                      toast.success(`IP ${ip} copied`);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] hover:border-primary/50 transition-colors group"
                    title="Click to copy IP"
                  >
                    <span>{ip}</span>
                    {copiedIp === ip ? (
                      <CheckCheck className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sessions History Table Card */}
          <SectionCard
            title="Authentication Sessions & Client Log"
            subtitle="Chronological history of user logins, IP addresses, browsers, and devices"
            icon={ShieldCheck}
            badge={
              <Badge variant="outline" className="text-xs font-semibold">
                {filteredSessions.length} of {rawSessions.length} Sessions
              </Badge>
            }
          >
            {/* Search Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={sessionSearch}
                  onChange={e => {
                    setSessionSearch(e.target.value);
                    setSessionPage(1);
                  }}
                  placeholder="Search by IP, browser, device, OS..."
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                {sessionSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSessionSearch("");
                      setSessionPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <span className="text-xs text-slate-400">
                Auto-records IP and client info upon every login
              </span>
            </div>

            {/* Sessions Table */}
            {paginatedSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 whitespace-nowrap">
                      <th className="px-4 py-3 font-semibold text-slate-500">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">IP Address</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Device & OS</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Browser</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Login Time</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Last Active</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedSessions.map((s: any) => {
                      const isCurrent = Boolean(s.isCurrent);
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isCurrent ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold text-[10px] gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Current Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400 text-[10px]">
                                Past Session
                              </Badge>
                            )}
                          </td>

                          {/* IP Address */}
                          <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3 w-3 text-slate-400" />
                              <span>{s.ipAddress || user.lastActiveIp || user.guestIp || "Unknown IP"}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const ip = s.ipAddress || user.lastActiveIp || user.guestIp || "";
                                  navigator.clipboard.writeText(ip);
                                  setCopiedIp(s.id);
                                  setTimeout(() => setCopiedIp(null), 2000);
                                  toast.success("IP copied to clipboard");
                                }}
                                className="text-slate-400 hover:text-primary transition-colors p-0.5"
                                title="Copy IP"
                              >
                                {copiedIp === s.id ? (
                                  <CheckCheck className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Device & OS */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              {s.device === "Mobile" ? (
                                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <Laptop className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <span>{s.os || "Desktop OS"}</span>
                              <span className="text-slate-400">({s.device || "Desktop"})</span>
                            </div>
                          </td>

                          {/* Browser */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant="outline" className="font-semibold text-[10.5px]">
                              {s.browser || "Web Browser"}
                            </Badge>
                          </td>

                          {/* Login Time */}
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            <div>{formatDate(s.loginAt || s.createdAt)}</div>
                            <div className="text-[10px] text-slate-400">{formatTimeAgo(s.loginAt || s.createdAt)}</div>
                          </td>

                          {/* Last Active */}
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {s.lastActiveAt ? formatTimeAgo(s.lastActiveAt) : formatTimeAgo(s.loginAt || s.createdAt)}
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono">
                            {formatDuration(s.durationSeconds)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
                <Globe className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No session logs found matching your search.
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  User login events will automatically populate this table with IP address, browser, OS, and session durations.
                </p>
              </div>
            )}

            {/* Pagination */}
            <PaginationBar
              currentPage={sessionPage}
              totalItems={filteredSessions.length}
              pageSize={sessionPageSize}
              onPageChange={setSessionPage}
              onPageSizeChange={size => {
                setSessionPageSize(size);
                setSessionPage(1);
              }}
            />
          </SectionCard>
        </div>
      )}

      {/* ─── TAB 7: PRIVATE INTERNAL STAFF NOTES ─────────────────────────────── */}
      {activeTab === "notes" && (
        <InternalNotesSection
          targetType="User"
          targetId={user.id}
          title={`Internal Collaboration Notes on ${user.name || user.email}`}
        />
      )}

      {/* ─── MODAL 1: SOFT BLOCK USER MODAL ─────────────────────────────────── */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Ban className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Soft-Block User Account
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Temporarily suspend <strong>{user.email}</strong> from logging in or using the app.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Quick Duration Presets */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Select Block Duration:
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

            {/* Custom Date Picker */}
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
                Suspension Reason / Internal Note:
              </label>
              <textarea
                rows={3}
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Reason for suspension (e.g. Terms violation, payment dispute, investigation)..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBlockModalOpen(false)}
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
                  <span>Applying Block...</span>
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5" />
                  <span>Confirm Soft-Block</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: FLAG TO SUPER ADMIN MODAL ─────────────────────────────── */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3 text-purple-600">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Flag className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Flag User to Super Admin
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Submit an escalation flag for Super Admin review and executive decision.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Requested Action */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Recommended Moderation Action:
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
                  <span>Request Soft Block</span>
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
                  <span>Request Account Deletion</span>
                </button>
              </div>
            </div>

            {/* Flag Reason */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Reason for Flagging: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                placeholder="Brief reason (e.g. Abusive support messages, fake cards, spamming)..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Additional Staff Note */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Additional Staff Notes / Context:
              </label>
              <textarea
                rows={3}
                value={flagNote}
                onChange={e => setFlagNote(e.target.value)}
                placeholder="Include any evidence, report IDs, ticket numbers, or context for the Super Admin..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFlagModalOpen(false)}
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
                  <span>Submitting Flag...</span>
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5" />
                  <span>Submit Flag</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: DELETE CONFIRMATION (SOFT DELETE OR HARD PURGE) ───────── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5.5 w-5.5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {immediateHardDelete ? "Permanently Purge User Account" : "Soft-Delete User Account"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {immediateHardDelete
                    ? "Immediate irreversible deletion from database."
                    : "60-day recovery retention policy applies automatically."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 my-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                {user.name || "Anonymous User"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {user.email} (ID: {user.id})
              </p>
              <p className="text-amber-700 dark:text-amber-400 font-medium text-[11px] pt-1">
                {immediateHardDelete
                  ? "⚠️ Warning: This will immediately purge all reports, collections, and Stripe associations permanently."
                  : "🛡️ Notice: All reports and collection details are preserved for 60 days. Admins can restore the account at any time within 60 days."}
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Reason for Account Deletion:
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Reason (e.g. Customer request, fraudulent activity)..."
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-destructive/20 focus:border-destructive"
              />
            </div>

            {/* Super Admin Hard Delete Option */}
            {isSuperAdmin && !immediateHardDelete && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={immediateHardDelete}
                  onChange={e => setImmediateHardDelete(e.target.checked)}
                  className="rounded border-slate-300 text-destructive focus:ring-destructive h-4 w-4"
                />
                <span className="text-xs">
                  Bypass 60-day retention and <strong>permanently purge immediately</strong> (Super Admin override)
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
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
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{immediateHardDelete ? "Purge Permanently" : "Confirm Soft Delete"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: REPORT INSPECTION MODAL ───────────────────────────────── */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
          {selectedReport && (
            <div className="space-y-5 text-xs">
              <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {selectedReport.address || `Inspection Report #${selectedReport.id.slice(0, 8)}`}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                      Created on {formatDate(selectedReport.createdAt)} • Type: {cap(selectedReport.type)}
                    </DialogDescription>
                  </div>
                  {getReportStatusBadge(selectedReport.status)}
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Score & Auspiciousness</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {selectedReport.overallScore ?? "—"}/100
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedReport.auspiciousnessLevel || "Standard Alignment"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400">AI Model & Token Metrics</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedReport.aiModel || "Gemini Pro Inspection"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    Total Tokens: {selectedReport.totalTokens || "—"}
                  </p>
                </div>
              </div>

              {selectedReport.overview && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Executive Overview:</p>
                  <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-850 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.overview}
                  </div>
                </div>
              )}

              {selectedReport.overallAlignmentSummary && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Alignment Summary:</p>
                  <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-850 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.overallAlignmentSummary}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-xl h-9 px-5 text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 5: SUPPORT INQUIRY VIEW & REPLY ──────────────────────────── */}
      <Dialog open={inquiryModalOpen} onOpenChange={setInquiryModalOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          {activeInquiry && (
            <div className="space-y-4 text-xs">
              <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {activeInquiry.subject}
                      </DialogTitle>
                      {getPriorityBadge(activeInquiry.priority)}
                      {getStatusBadge(activeInquiry.status)}
                    </div>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                      Received from <strong>{activeInquiry.name}</strong> ({activeInquiry.email}) on {formatDate(activeInquiry.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Customer Message:
                </span>
                <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeInquiry.message}
                </div>
              </div>

              {activeInquiry.replyMessage && (
                <div className="space-y-1.5 pl-3.5 border-l-2 border-emerald-500">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sent Reply ({formatDate(activeInquiry.repliedAt)}):
                  </span>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {activeInquiry.replyMessage}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Compose Email Response:
                </span>
                <input
                  type="text"
                  value={inquiryCustomSubject}
                  onChange={e => setInquiryCustomSubject(e.target.value)}
                  placeholder="Subject for response email..."
                  className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <textarea
                  rows={4}
                  value={inquiryReplyMessage}
                  onChange={e => setInquiryReplyMessage(e.target.value)}
                  placeholder={`Dear ${activeInquiry.name},\n\nThank you for reaching out to Dwellr support...`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y min-h-[110px] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInquiryModalOpen(false)}
                  className="rounded-xl h-9 text-xs font-semibold px-4"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!inquiryReplyMessage.trim() || replyMutation.isPending}
                  onClick={handleSendInquiryReply}
                  className="rounded-xl h-9 px-5 text-xs font-bold gap-1.5 shadow-xs"
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Response</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 6: DIRECT ADMIN MESSAGE USER MODAL ──────────────────────── */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Send className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Message User
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Send an official communication email to <strong>{user.email}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 my-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
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
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />

              <textarea
                rows={6}
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                placeholder={`Dear ${user.name || "Customer"},\n\nWe are reaching out to you from Dwellr administration...`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y min-h-[140px] leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMessageModalOpen(false)}
              className="rounded-xl h-9 text-xs font-semibold px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!emailSubject.trim() || !emailMessage.trim() || isSendingMail}
              onClick={handleSendMessage}
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
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 7: GRANT SUBSCRIPTION ACCESS MODAL ──────────────────────── */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="sm:max-w-xl w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
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
                  Grant complimentary active platform access to <strong>{user.name || user.email}</strong> without requiring Stripe checkout.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
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
              onClick={() => setGrantModalOpen(false)}
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
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 8: REVOKE SUBSCRIPTION ACCESS MODAL ──────────────────────── */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
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
                  Reset <strong>{user.name || user.email}</strong> back to the Free Tier.
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
              onClick={() => setRevokeModalOpen(false)}
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
        </DialogContent>
      </Dialog>
    </section>
  );
}
