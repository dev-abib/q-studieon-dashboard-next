"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MailQuestion,
  MessageSquareText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  UserCheck,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Mail,
  User,
  UserPlus,
  ShieldCheck,
  Calendar,
  X,
  Sparkles,
  ExternalLink,
  MoreVertical,
  Reply,
  Eye,
  ArrowRightLeft,
  Users,
  Shield,
  Briefcase,
  HelpCircle,
  Download,
  Filter,
  UserX,
  ChevronDown,
  LayoutGrid,
  CheckSquare,
  Square,
  FileText,
  StickyNote,
  History,
  Check,
  Zap,
  Columns,
  Table as TableIcon,
  CornerDownRight,
  Inbox,
  Share2,
  Copy,
  CheckCheck,
  Tag,
  ArrowLeft,
  Layers,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { useGetAllQueries } from "@/features/contact-queries/hooks/use-get-all-queries";
import { useQueryStats } from "@/features/contact-queries/hooks/use-query-stats";
import { useReplyQuery } from "@/features/contact-queries/hooks/use-reply-query";
import { useStaffMembers } from "@/features/contact-queries/hooks/use-staff-members";
import { useAssignQuery } from "@/features/contact-queries/hooks/use-assign-query";
import { useUpdatePriority } from "@/features/contact-queries/hooks/use-update-priority";
import { useAddInternalNote } from "@/features/contact-queries/hooks/use-add-internal-note";
import { useBulkAction } from "@/features/contact-queries/hooks/use-bulk-action";
import { useToggleDeletePermission } from "@/features/contact-queries/hooks/use-toggle-delete-permission";
import { useToggleUserDetailsPermission } from "@/features/contact-queries/hooks/use-toggle-user-details-permission";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import {
  useUpdateQueryStatus,
  useDeleteQuery,
} from "@/features/contact-queries/hooks/use-update-status";
import {
  ContactQuery,
  ContactQueryStatus,
  ContactQueryPriority,
  StaffMember,
} from "@/features/contact-queries/types/contact-queries.types";

type SortField = "createdAt" | "name" | "status" | "email";
type SortDir = "asc" | "desc";
type ViewMode = "split" | "table";

// Canned Response Templates
const CANNED_TEMPLATES = [
  {
    title: "Enterprise Pricing & Quote",
    category: "Sales",
    subject: "Re: Dwellr Enterprise & Custom Pricing Details",
    body: `Thank you for your interest in Dwellr Enterprise.\n\nOur enterprise plan includes unlimited analyses, dedicated account management, custom branding, and SLA guarantee.\n\nCould you share your team size and monthly report volume so we can prepare a tailored contract proposal?`,
  },
  {
    title: "Technical Support Resolution",
    category: "Support",
    subject: "Re: Support Case Update & Resolution",
    body: `Thank you for bringing this to our attention.\n\nOur technical team has reviewed and resolved the reported issue. Please refresh your session and let us know if everything is functioning as expected.`,
  },
  {
    title: "Billing & Invoicing Help",
    category: "Finance",
    subject: "Re: Billing & Subscription Inquiry",
    body: `Thank you for reaching out regarding your billing inquiry.\n\nWe have verified your account and transaction details. Your invoice and receipts have been updated and forwarded to your email address.`,
  },
  {
    title: "Feature Request Acknowledgment",
    category: "Product",
    subject: "Re: Feature Request & Product Feedback",
    body: `Thank you for your valuable suggestion.\n\nWe have logged your request with our product roadmap team for review. We will notify you as updates roll out!`,
  },
];

// Friendly time format helper
function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSec < 60) return "Just now";
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function QueriesPageContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlStatus = (searchParams.get("status") as ContactQueryStatus) || "ALL";
  const urlPriority =
    (searchParams.get("priority") as ContactQueryPriority) || "ALL";

  // View mode (split inbox vs table)
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters & State
  const [search, setSearch] = useState(urlSearch);
  const [searchVal, setSearchVal] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<ContactQueryStatus | "ALL">(
    urlStatus,
  );
  const [priorityFilter, setPriorityFilter] = useState<
    ContactQueryPriority | "ALL"
  >(urlPriority);
  const [registeredFilter, setRegisteredFilter] = useState<
    "ALL" | "REGISTERED" | "GUEST"
  >("ALL");
  const [assignedFilter, setAssignedFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortDir>("desc");

  // Debounce search input changes to prevent constant API refetching
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchVal);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Keep search in sync if search param in URL changes
  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null && q !== searchVal) {
      setSearchVal(q);
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  // Multi-Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Active / Selected Query
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reply" | "notes" | "timeline">(
    "reply",
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [newStaffNote, setNewStaffNote] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Super Admin Permissions Modal State
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  // Assignment / Transfer Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [queryToAssign, setQueryToAssign] = useState<ContactQuery | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [transferNote, setTransferNote] = useState("");

  // Bulk Assign Modal State
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkStaffId, setBulkStaffId] = useState("");
  const [bulkTransferNote, setBulkTransferNote] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ContactQuery | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Queries & Stats Hooks
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: search.trim() || undefined,
      status: statusFilter,
      priority: priorityFilter,
      isRegisteredUser:
        registeredFilter === "REGISTERED"
          ? true
          : registeredFilter === "GUEST"
            ? false
            : undefined,
      assignedToId: assignedFilter !== "ALL" ? assignedFilter : undefined,
      sortBy,
      sortOrder,
    };
  }, [
    page,
    limit,
    search,
    statusFilter,
    priorityFilter,
    registeredFilter,
    assignedFilter,
    sortBy,
    sortOrder,
  ]);

  const { data: currentUserRes } = useCurrentUser();
  const {
    data: queriesRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllQueries(queryParams);
  const { data: stats } = useQueryStats();
  const { data: rawStaffMembers, isLoading: isLoadingStaff } =
    useStaffMembers();

  // Current User Permission Assessment
  const currentUser = currentUserRes?.data || currentUserRes;
  const isSuperAdmin =
    currentUser?.role === "super_admin" || currentUser?.isOwner;
  const canDelete = isSuperAdmin || Boolean(currentUser?.canDeleteQueries);

  const staffMembers: StaffMember[] = useMemo(() => {
    if (Array.isArray(rawStaffMembers)) return rawStaffMembers;
    if (Array.isArray((rawStaffMembers as any)?.data))
      return (rawStaffMembers as any).data;
    return [];
  }, [rawStaffMembers]);

  const updateStatusMutation = useUpdateQueryStatus();
  const updatePriorityMutation = useUpdatePriority();
  const addInternalNoteMutation = useAddInternalNote();
  const bulkActionMutation = useBulkAction();
  const deleteMutation = useDeleteQuery();
  const assignMutation = useAssignQuery();
  const togglePermissionMutation = useToggleDeletePermission();
  const toggleUserDetailsMutation = useToggleUserDetailsPermission();

  const queries = queriesRes?.data || [];
  const meta = queriesRes?.meta;

  // Selected query object derived from queries or activeQueryId (no incorrect fallback to queries[0])
  const activeQuery = useMemo(() => {
    if (!queries || queries.length === 0) return null;
    if (activeQueryId) {
      return queries.find(q => q.id === activeQueryId) || null;
    }
    return queries[0] || null;
  }, [queries, activeQueryId]);

  // Set default active query on first load, or sync if currently selected query disappears (e.g. filtered out)
  useEffect(() => {
    if (queries.length > 0) {
      const activeExists = queries.some(q => q.id === activeQueryId);
      if (!activeQueryId || !activeExists) {
        setActiveQueryId(queries[0].id);
        setCustomSubject(`Re: ${queries[0].subject}`);
        setReplyMessage("");
      }
    }
  }, [queries, activeQueryId]);

  // Reply mutation for active inquiry
  const replyMutation = useReplyQuery(activeQuery?.id || "");

  // Selection helpers
  const isAllSelected =
    queries.length > 0 && selectedIds.length === queries.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < queries.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queries.map(q => q.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const handleSelectQueryInSplit = (query: ContactQuery) => {
    setActiveQueryId(query.id);
    setCustomSubject(`Re: ${query.subject}`);
    setReplyMessage("");
    setNewStaffNote("");
    setMobileDetailOpen(true);
  };

  const handleNavigateQuery = (direction: "prev" | "next") => {
    if (!queries || queries.length === 0 || !activeQuery) return;
    const currentIndex = queries.findIndex(q => q.id === activeQuery.id);
    if (currentIndex === -1) return;

    if (direction === "prev" && currentIndex > 0) {
      handleSelectQueryInSplit(queries[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < queries.length - 1) {
      handleSelectQueryInSplit(queries[currentIndex + 1]);
    }
  };

  const handleOpenReplyModal = (query: ContactQuery) => {
    setActiveQueryId(query.id);
    setReplyMessage("");
    setCustomSubject(`Re: ${query.subject}`);
    setNewStaffNote("");
    setActiveTab("reply");
    setReplyOpen(true);
  };

  const handleApplyTemplate = (tpl: (typeof CANNED_TEMPLATES)[0]) => {
    if (!activeQuery) return;
    setCustomSubject(tpl.subject);
    setReplyMessage(`Dear ${activeQuery.name},\n\n${tpl.body}`);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSaveInternalNote = async () => {
    if (!activeQuery || !newStaffNote.trim()) return;

    try {
      await addInternalNoteMutation.mutateAsync({
        id: activeQuery.id,
        note: newStaffNote.trim(),
      });
      setNewStaffNote("");
    } catch {
      // Handled by hook
    }
  };

  const handleOpenAssignModal = (query: ContactQuery) => {
    setQueryToAssign(query);
    setSelectedStaffId(query.assignedToId || "");
    setTransferNote(query.transferNote || "");
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!queryToAssign || !selectedStaffId) return;

    try {
      await assignMutation.mutateAsync({
        id: queryToAssign.id,
        payload: {
          assignedToId: selectedStaffId,
          transferNote: transferNote.trim() || undefined,
        },
      });
      setAssignModalOpen(false);
      setQueryToAssign(null);
    } catch {
      // Handled by hook
    }
  };

  const handleSendReply = async () => {
    if (!activeQuery || !replyMessage.trim()) return;

    try {
      await replyMutation.mutateAsync({
        replyMessage: replyMessage.trim(),
        customSubject: customSubject.trim() || undefined,
      });
      setReplyMessage("");
      if (replyOpen) setReplyOpen(false);
    } catch {
      // Handled by hook
    }
  };

  const handleQuickStatusChange = (
    id: string,
    newStatus: ContactQueryStatus,
  ) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleQuickPriorityChange = (
    id: string,
    newPriority: ContactQueryPriority,
  ) => {
    updatePriorityMutation.mutate({ id, priority: newPriority });
  };

  // Keyboard shortcut support (Ctrl+Enter to send reply)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Bulk Actions
  const handleBulkStatus = async (status: ContactQueryStatus) => {
    if (selectedIds.length === 0) return;
    await bulkActionMutation.mutateAsync({
      ids: selectedIds,
      action: "UPDATE_STATUS",
      status,
    });
    setSelectedIds([]);
  };

  const handleBulkPriority = async (priority: ContactQueryPriority) => {
    if (selectedIds.length === 0) return;
    await bulkActionMutation.mutateAsync({
      ids: selectedIds,
      action: "UPDATE_PRIORITY",
      priority,
    });
    setSelectedIds([]);
  };

  const handleConfirmBulkAssign = async () => {
    if (selectedIds.length === 0 || !bulkStaffId) return;
    await bulkActionMutation.mutateAsync({
      ids: selectedIds,
      action: "ASSIGN",
      assignedToId: bulkStaffId,
      transferNote: bulkTransferNote.trim() || undefined,
    });
    setBulkAssignOpen(false);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!canDelete) {
      toast.error(
        "Permission Denied: Only Super Admin or staff with delete privileges can delete inquiries.",
      );
      return;
    }

    if (
      confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} inquiries?`,
      )
    ) {
      await bulkActionMutation.mutateAsync({
        ids: selectedIds,
        action: "DELETE",
      });
      setSelectedIds([]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      toast.error(
        "Permission Denied: Only Super Admin or staff with delete privileges can delete inquiries.",
      );
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      // Handled by hook
    }
  };

  const handleToggleStaffDeletePermission = async (
    staffId: string,
    currentStatus: boolean,
  ) => {
    try {
      await togglePermissionMutation.mutateAsync({
        staffId,
        canDelete: !currentStatus,
      });
    } catch {
      // Handled by hook toast
    }
  };

  const handleToggleStaffUserDetailsPermission = async (
    staffId: string,
    currentStatus: boolean,
  ) => {
    try {
      await toggleUserDetailsMutation.mutateAsync({
        staffId,
        canViewUserDetails: !currentStatus,
      });
    } catch {
      // Handled by hook toast
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setRegisteredFilter("ALL");
    setAssignedFilter("ALL");
    setSearch("");
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!queries || queries.length === 0) return;

    const headers = [
      "ID",
      "Subject",
      "Sender Name",
      "Sender Email",
      "User Type",
      "Priority",
      "Status",
      "Assigned To",
      "Assigned Role",
      "Replied By",
      "Replied At",
      "Created At",
    ];

    const rows = queries.map(q => [
      q.id,
      `"${(q.subject || "").replace(/"/g, '""')}"`,
      `"${(q.name || "").replace(/"/g, '""')}"`,
      q.email,
      q.isRegisteredUser ? "Registered User" : "Guest",
      q.priority || "MEDIUM",
      q.status,
      `"${(q.assignedToName || "Unassigned").replace(/"/g, '""')}"`,
      q.assignedToRole || "",
      `"${(q.repliedByName || "N/A").replace(/"/g, '""')}"`,
      q.repliedAt ? new Date(q.repliedAt).toISOString() : "N/A",
      new Date(q.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `inquiries-export-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ContactQueryStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold text-[10.5px] gap-1"
          >
            <Clock className="h-2.5 w-2.5" />
            Pending
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold text-[10.5px] gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold text-[10.5px] gap-1"
          >
            <CheckCircle2 className="h-2.5 w-2.5" />
            Resolved
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 font-semibold text-[10.5px]"
          >
            Closed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority?: ContactQueryPriority) => {
    switch (priority) {
      case "URGENT":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold text-[10px] gap-1 animate-pulse"
          >
            <Flame className="h-3 w-3 text-red-500" />
            Urgent
          </Badge>
        );
      case "HIGH":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 font-semibold text-[10px] gap-1"
          >
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            High
          </Badge>
        );
      case "LOW":
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 text-[10px]"
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

  const getRoleLabel = (role?: string | null) => {
    if (!role) return "Staff";
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "customer_support":
        return "Support Lead";
      case "content_manager":
        return "Content Mgr";
      case "finance":
        return "Finance";
      default:
        return role;
    }
  };

  // Pagination page buttons generator
  const paginationRange = useMemo(() => {
    if (!meta) return [];
    const totalPages = meta.totalPages;
    const current = meta.page;
    const delta = 1;

    const range: (number | string)[] = [];
    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift("...");
    }
    if (current + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [meta]);

  const activeIndex = queries.findIndex(q => q.id === activeQuery?.id);

  return (
    <section className="w-full flex flex-col gap-5 pb-16">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <PageHeader
        kicker="Support & Communications"
        title="User Inquiries & Case Management"
        icon={MailQuestion}
        description="Review inbound messages, track response SLAs, collaborate with staff notes, and delegate cases."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("split")}
              className={`h-7.5 px-3 rounded-lg text-xs gap-1.5 font-semibold ${
                viewMode === "split"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Inbox View</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7.5 px-3 rounded-lg text-xs gap-1.5 font-semibold ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table Grid</span>
            </Button>
          </div>

          {/* Super Admin Manage Permissions Button */}
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPermissionsModalOpen(true)}
              className="gap-1.5 rounded-xl text-xs h-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              title="Manage Staff Deletion Privileges"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Staff Privileges</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={queries.length === 0}
            className="gap-1.5 rounded-xl text-xs h-8"
            title="Export filtered inquiries to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 rounded-xl text-xs h-8"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </PageHeader>

      {/* ─── Compact Quick Metric Ribbon ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Inquiries */}
        {(() => {
          const isTotalActive =
            statusFilter === "ALL" &&
            priorityFilter === "ALL" &&
            registeredFilter === "ALL" &&
            assignedFilter === "ALL" &&
            !search;
          return (
            <div
              onClick={() => {
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setRegisteredFilter("ALL");
                setAssignedFilter("ALL");
                setSearchVal("");
                setSearch("");
                setPage(1);
              }}
              className={`p-3 rounded-2xl border shadow-2xs cursor-pointer transition-all flex items-center justify-between group ${
                isTotalActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-primary/40"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Total Inquiries
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-primary transition-colors">
                  {stats?.total ?? queries.length}
                </p>
              </div>
              <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <MailQuestion className="h-4 w-4" />
              </div>
            </div>
          );
        })()}

        {/* Pending Response */}
        {(() => {
          const isPendingActive =
            statusFilter === "PENDING" &&
            priorityFilter === "ALL" &&
            registeredFilter === "ALL" &&
            assignedFilter === "ALL" &&
            !search;
          return (
            <div
              onClick={() => {
                setStatusFilter("PENDING");
                setPriorityFilter("ALL");
                setRegisteredFilter("ALL");
                setAssignedFilter("ALL");
                setSearchVal("");
                setSearch("");
                setPage(1);
              }}
              className={`p-3 rounded-2xl border shadow-2xs cursor-pointer transition-all flex items-center justify-between group ${
                isPendingActive
                  ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-500/30"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Pending Action
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {stats?.pending ?? 0}
                  </p>
                  {Boolean(stats?.urgentCount) && (
                    <span className="text-[9.5px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded-md">
                      {stats?.urgentCount} Urgent
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8.5 w-8.5 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          );
        })()}

        {/* Resolved / Replied */}
        {(() => {
          const isResolvedActive =
            statusFilter === "RESOLVED" &&
            priorityFilter === "ALL" &&
            registeredFilter === "ALL" &&
            assignedFilter === "ALL" &&
            !search;
          return (
            <div
              onClick={() => {
                setStatusFilter("RESOLVED");
                setPriorityFilter("ALL");
                setRegisteredFilter("ALL");
                setAssignedFilter("ALL");
                setSearchVal("");
                setSearch("");
                setPage(1);
              }}
              className={`p-3 rounded-2xl border shadow-2xs cursor-pointer transition-all flex items-center justify-between group ${
                isResolvedActive
                  ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Resolved Cases
                </p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {stats?.resolved ?? 0}
                </p>
              </div>
              <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          );
        })()}

        {/* Registered App Users */}
        {(() => {
          const isRegisteredActive =
            registeredFilter === "REGISTERED" &&
            statusFilter === "ALL" &&
            priorityFilter === "ALL" &&
            assignedFilter === "ALL" &&
            !search;
          return (
            <div
              onClick={() => {
                setRegisteredFilter("REGISTERED");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setAssignedFilter("ALL");
                setSearchVal("");
                setSearch("");
                setPage(1);
              }}
              className={`p-3 rounded-2xl border shadow-2xs cursor-pointer transition-all flex items-center justify-between group ${
                isRegisteredActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-primary/40"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Registered Users
                </p>
                <p className="text-xl font-bold text-primary mt-0.5">
                  {stats?.registeredUserCount ?? 0}
                </p>
              </div>
              <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── Modern Filter & Staff Hub Strip ──────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search sender, email, subject, or message content..."
              className="pl-9.5 pr-8 rounded-xl text-xs h-8 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 focus-visible:ring-primary/20"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => {
                  setSearchVal("");
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-[11px] gap-1.5 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    {statusFilter === "ALL"
                      ? "All Statuses"
                      : statusFilter === "PENDING"
                        ? "Pending"
                        : statusFilter === "IN_PROGRESS"
                          ? "In Progress"
                          : "Resolved"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-xl text-xs"
              >
                <DropdownMenuLabel className="text-[11px] text-slate-400">
                  Filter by Status
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("ALL");
                    setPage(1);
                  }}
                >
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("PENDING");
                    setPage(1);
                  }}
                  className="flex items-center justify-between"
                >
                  <span>Pending</span>
                  {getStatusBadge("PENDING")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("IN_PROGRESS");
                    setPage(1);
                  }}
                  className="flex items-center justify-between"
                >
                  <span>In Progress</span>
                  {getStatusBadge("IN_PROGRESS")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("RESOLVED");
                    setPage(1);
                  }}
                  className="flex items-center justify-between"
                >
                  <span>Resolved</span>
                  {getStatusBadge("RESOLVED")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Priority Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-[11px] gap-1.5 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {priorityFilter === "ALL"
                      ? "Priority"
                      : `${priorityFilter}`}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-xl text-xs"
              >
                <DropdownMenuLabel className="text-[11px] text-slate-400">
                  Filter by Priority
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setPriorityFilter("ALL");
                    setPage(1);
                  }}
                >
                  All Priorities
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map(p => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => {
                      setPriorityFilter(p);
                      setPage(1);
                    }}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>{p}</span>
                    {getPriorityBadge(p)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Type Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-[11px] gap-1.5 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                >
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {registeredFilter === "ALL"
                      ? "All User Types"
                      : registeredFilter === "REGISTERED"
                        ? "Registered Users"
                        : "Guests / Non-Users"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-xl text-xs"
              >
                <DropdownMenuLabel className="text-[11px] text-slate-400">
                  Filter by User Type
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setRegisteredFilter("ALL");
                    setPage(1);
                  }}
                >
                  All User Types
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setRegisteredFilter("REGISTERED");
                    setPage(1);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Registered Users</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRegisteredFilter("GUEST");
                    setPage(1);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Guests</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Staff Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-[11px] gap-1.5 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                >
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {assignedFilter === "ALL"
                      ? "Assignee"
                      : assignedFilter === "UNASSIGNED"
                        ? "Unassigned"
                        : staffMembers
                            .find(s => s.id === assignedFilter)
                            ?.name?.split(" ")[0] || "Assigned"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl text-xs"
              >
                <DropdownMenuLabel className="text-[11px] text-slate-400">
                  Filter by Staff Assignee
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setAssignedFilter("ALL");
                    setPage(1);
                  }}
                  className={
                    assignedFilter === "ALL" ? "font-bold text-primary" : ""
                  }
                >
                  All Assignees
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setAssignedFilter("UNASSIGNED");
                    setPage(1);
                  }}
                  className={
                    assignedFilter === "UNASSIGNED"
                      ? "font-bold text-primary"
                      : ""
                  }
                >
                  Unassigned Cases
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {staffMembers.map(staff => (
                  <DropdownMenuItem
                    key={staff.id}
                    onClick={() => {
                      setAssignedFilter(staff.id);
                      setPage(1);
                    }}
                    className={`flex items-center justify-between ${
                      assignedFilter === staff.id
                        ? "font-bold text-primary"
                        : ""
                    }`}
                  >
                    <span className="truncate">
                      {staff.name || staff.email}
                    </span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1">
                      {getRoleLabel(staff.role)}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters if active */}
            {(statusFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              registeredFilter !== "ALL" ||
              assignedFilter !== "ALL" ||
              search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Row */}
        {(statusFilter !== "ALL" ||
          priorityFilter !== "ALL" ||
          registeredFilter !== "ALL" ||
          assignedFilter !== "ALL" ||
          search) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10.5px]">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mr-1">
              Active Filters:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                Search: "{search}"
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal("");
                    setSearch("");
                  }}
                  className="hover:text-slate-700 text-slate-400"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}

            {statusFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/50 dark:border-blue-900/30">
                Status: {statusFilter.toLowerCase()}
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className="hover:text-blue-700 text-blue-400"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}

            {priorityFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-405 font-semibold border border-amber-200/50 dark:border-amber-900/30">
                Priority: {priorityFilter.toLowerCase()}
                <button
                  type="button"
                  onClick={() => setPriorityFilter("ALL")}
                  className="hover:text-amber-700 text-amber-400"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}

            {registeredFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/55 dark:border-emerald-900/30">
                User:{" "}
                {registeredFilter === "REGISTERED" ? "registered" : "guest"}
                <button
                  type="button"
                  onClick={() => setRegisteredFilter("ALL")}
                  className="hover:text-emerald-700 text-emerald-400"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}

            {assignedFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-semibold border border-violet-200/50 dark:border-violet-900/30">
                Assignee:{" "}
                {assignedFilter === "UNASSIGNED"
                  ? "unassigned"
                  : staffMembers.find(s => s.id === assignedFilter)?.name ||
                    "Staff"}
                <button
                  type="button"
                  onClick={() => setAssignedFilter("ALL")}
                  className="hover:text-violet-750 text-violet-400"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-slate-400 hover:text-slate-900 font-bold ml-1 hover:underline text-[10px]"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Live Staff Workload Badges Ribbon */}
        {stats?.staffWorkload && stats.staffWorkload.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none]">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Staff filter:
            </span>
            <button
              type="button"
              onClick={() => {
                setAssignedFilter("ALL");
                setPage(1);
              }}
              className={`h-7 px-3 rounded-full text-xs font-semibold shrink-0 transition-all ${
                assignedFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignedFilter("UNASSIGNED");
                setPage(1);
              }}
              className={`h-7 px-3 rounded-full text-xs font-semibold shrink-0 transition-all ${
                assignedFilter === "UNASSIGNED"
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "bg-amber-50 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
              }`}
            >
              Unassigned ({stats.unassignedCount ?? 0})
            </button>
            {stats.staffWorkload.map(staff => {
              const isActive = assignedFilter === staff.staffId;
              return (
                <button
                  key={staff.staffId}
                  type="button"
                  onClick={() => {
                    setAssignedFilter(staff.staffId);
                    setPage(1);
                  }}
                  className={`h-7 pl-1.5 pr-3 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="h-4.5 w-4.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-[9.5px] shrink-0 border border-primary/20">
                    {staff.staffName ? staff.staffName[0].toUpperCase() : "S"}
                  </div>
                  <span>{staff.staffName.split(" ")[0]}</span>
                  <span
                    className={`text-[9.5px] px-1 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-850 text-slate-400"}`}
                  >
                    {staff.total}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DUAL VIEW: 1. SPLIT MASTER-DETAIL INBOX VIEW ─────────────────── */}
      {viewMode === "split" ? (
        <div className="h-[800px] min-h-[640px] w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Fixed-Width Scrollable Inquiry List */}
          <div
            className={`w-full lg:w-[360px] xl:w-[400px] shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-0 bg-slate-50/40 dark:bg-slate-950/20 ${
              mobileDetailOpen ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* List Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-slate-400 hover:text-primary"
                  title="Select all"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {meta ? `${meta.total} Inquiries` : "Inquiries"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Sort:</span>
                <button
                  type="button"
                  onClick={() => toggleSort("createdAt")}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-primary flex items-center gap-0.5"
                >
                  Date{" "}
                  {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
              </div>
            </div>

            {/* List Body with overscroll-contain */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-2 space-y-1">
              {isLoading ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-medium">
                    Loading inquiries...
                  </span>
                </div>
              ) : queries.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2.5">
                  <Inbox className="h-9 w-9 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    No inquiries found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-7 px-3 text-[11px] rounded-lg"
                  >
                    Clear Filter
                  </Button>
                </div>
              ) : (
                queries.map(q => {
                  const isSelected = activeQuery?.id === q.id;
                  const isChecked = selectedIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleSelectQueryInSplit(q)}
                      className={`group p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 border relative ${
                        isSelected
                          ? "bg-white dark:bg-slate-800/95 border-primary shadow-xs ring-1 ring-primary/20 border-l-4 border-l-primary"
                          : "bg-white/60 dark:bg-slate-900/60 border-transparent hover:bg-white hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleSelectRow(q.id);
                            }}
                            className="text-slate-400 hover:text-primary shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Square className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div className="h-6.5 w-6.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10.5px] shrink-0 border border-primary/20">
                            {q.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                            {q.name}
                          </span>
                          {q.isRegisteredUser && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
                              title="Registered User"
                            />
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                          {formatTimeAgo(q.createdAt)}
                        </span>
                      </div>

                      {/* Subject */}
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {q.subject}
                      </p>

                      {/* Snippet */}
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
                        {q.message}
                      </p>

                      {/* Badges & Quick Hover Bar */}
                      <div className="flex items-center justify-between pt-0.5 gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(q.priority)}
                          {getStatusBadge(q.status)}
                        </div>

                        <div className="flex items-center gap-1">
                          {q.assignedToName && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                              → {q.assignedToName.split(" ")[0]}
                            </span>
                          )}

                          {/* Quick Resolve Button on hover */}
                          {q.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleQuickStatusChange(q.id, "RESOLVED");
                              }}
                              className="hidden group-hover:inline-flex text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-md hover:bg-emerald-100 font-semibold"
                              title="Quick Mark Resolved"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* List Pagination Footer */}
            {meta && meta.totalPages > 1 && (
              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={!meta.hasPrevPage}
                  className="h-7 px-2.5 text-[11px]"
                >
                  Prev
                </Button>
                <span className="text-[11px] text-slate-400">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage(prev => Math.min(prev + 1, meta.totalPages))
                  }
                  disabled={!meta.hasNextPage}
                  className="h-7 px-2.5 text-[11px]"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Right: Flex-1 Active Inquiry Detail & Sticky Live Composer */}
          <div
            className={`flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 overflow-hidden ${
              !mobileDetailOpen ? "hidden lg:flex" : "flex"
            }`}
          >
            {activeQuery ? (
              <div className="flex-1 flex flex-col h-full min-h-0">
                {/* Detail Header & Action Toolbar */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 shrink-0">
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    {/* Mobile Back Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileDetailOpen(false)}
                      className="lg:hidden h-8 w-8 rounded-lg shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                          {activeQuery.subject}
                        </h3>
                        {getPriorityBadge(activeQuery.priority)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                        <span>
                          From: <strong>{activeQuery.name}</strong>
                        </span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(activeQuery.email)}
                          className="text-slate-400 hover:text-primary inline-flex items-center gap-1 text-[11px]"
                          title="Click to copy email"
                        >
                          <span>{activeQuery.email}</span>
                          {copiedEmail ? (
                            <CheckCheck className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        {activeQuery.isRegisteredUser &&
                          (activeQuery.userId || activeQuery.user?.id ? (
                            <Link
                              href={`/dashboard/users/${activeQuery.userId || activeQuery.user?.id}`}
                              className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 border border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-semibold transition-colors shrink-0"
                              title="View registered user account profile"
                            >
                              <span>Registered User</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                            </Link>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-600 text-[9.5px] py-0"
                            >
                              Registered User
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Fast Navigation & Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeQuery.isRegisteredUser &&
                      (activeQuery.userId || activeQuery.user?.id) && (
                        <Link
                          href={`/dashboard/users/${activeQuery.userId || activeQuery.user?.id}`}
                          className="h-8 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold transition-colors"
                          title="View registered user account details"
                        >
                          <User className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View Profile</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleNavigateQuery("prev")}
                      disabled={activeIndex <= 0}
                      className="h-8 w-8 rounded-lg"
                      title="Previous Inquiry (Up)"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[11px] text-slate-400 font-medium px-1">
                      {activeIndex + 1} of {queries.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleNavigateQuery("next")}
                      disabled={activeIndex >= queries.length - 1}
                      className="h-8 w-8 rounded-lg"
                      title="Next Inquiry (Down)"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAssignModal(activeQuery)}
                      className="h-8 px-2.5 text-xs rounded-xl gap-1"
                    >
                      <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                      <span>Transfer</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl text-xs"
                      >
                        {activeQuery.isRegisteredUser &&
                          (activeQuery.userId || activeQuery.user?.id) && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/users/${activeQuery.userId || activeQuery.user?.id}`}
                                  className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-600 dark:text-emerald-400"
                                >
                                  <User className="h-3.5 w-3.5" />
                                  <span>View User Profile</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                        <DropdownMenuLabel className="text-[11px]">
                          Quick Status
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            handleQuickStatusChange(activeQuery.id, "RESOLVED")
                          }
                        >
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleQuickStatusChange(
                              activeQuery.id,
                              "IN_PROGRESS",
                            )
                          }
                        >
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleQuickStatusChange(activeQuery.id, "PENDING")
                          }
                        >
                          Mark Pending
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteTarget(activeQuery);
                                setDeleteOpen(true);
                              }}
                              className="text-destructive"
                            >
                              Delete Inquiry
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="px-5 pt-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reply")}
                    className={`py-2 border-b-2 font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === "reply"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    <span>Conversation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className={`py-2 border-b-2 font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === "notes"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    <span>Team Notes</span>
                    {Boolean(activeQuery.internalNotes) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    className={`py-2 border-b-2 font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === "timeline"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Audit Trail</span>
                  </button>
                </div>

                {/* Middle: Scrollable Conversation Content with overscroll-contain */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-4 sm:p-5 space-y-3.5">
                  {/* Status & Assignment Banner */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-slate-500">Assignee:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeQuery.assignedToName || "Unassigned"}
                      </span>
                      {activeQuery.assignedToRole && (
                        <Badge variant="outline" className="text-[9.5px] py-0">
                          {getRoleLabel(activeQuery.assignedToRole)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Status:</span>
                      {getStatusBadge(activeQuery.status)}
                    </div>
                  </div>

                  {activeQuery.transferNote && (
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 text-xs text-blue-700 dark:text-blue-300 italic">
                      Transfer Note: {activeQuery.transferNote}
                    </div>
                  )}

                  {/* TAB 1: CONVERSATION */}
                  {activeTab === "reply" && (
                    <div className="space-y-4">
                      {/* Customer Message Bubble - Prominent & Ultra-Readable */}
                      <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs ring-1 ring-primary/20 shrink-0">
                              {activeQuery.name?.[0]?.toUpperCase() || "C"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {activeQuery.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {activeQuery.email}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium shrink-0">
                            {new Date(activeQuery.createdAt).toLocaleString(
                              [],
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed font-normal pt-1">
                          {activeQuery.message}
                        </div>
                      </div>

                      {/* Previous Admin Reply (if exists) */}
                      {activeQuery.replyMessage && (
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs space-y-3">
                          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/50 dark:border-emerald-800/40">
                            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>
                                Official Reply by{" "}
                                {activeQuery.repliedByName || "Admin"}
                              </span>
                            </div>
                            <span className="text-emerald-600/70 dark:text-emerald-400/70 text-[11px] font-medium">
                              {activeQuery.repliedAt
                                ? new Date(
                                    activeQuery.repliedAt,
                                  ).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed font-normal">
                            {activeQuery.replyMessage}
                          </div>
                        </div>
                      )}

                      {/* Reply Composer Card - Directly Below Conversation */}
                      <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3.5 mt-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Reply className="h-3.5 w-3.5 text-primary" />
                            Compose Response Email
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Sending to:{" "}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {activeQuery.email}
                            </strong>
                          </span>
                        </div>

                        {/* Canned Templates */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            Presets:
                          </span>
                          {CANNED_TEMPLATES.map(tpl => (
                            <button
                              key={tpl.title}
                              type="button"
                              onClick={() => handleApplyTemplate(tpl)}
                              className="px-2.5 py-1 rounded-lg text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200/60 dark:border-slate-700/60 font-medium shrink-0 whitespace-nowrap"
                            >
                              + {tpl.title}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Input
                            value={customSubject}
                            onChange={e => setCustomSubject(e.target.value)}
                            placeholder="Subject for response email..."
                            className="rounded-xl text-xs h-8.5 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium"
                          />
                          <textarea
                            rows={4}
                            value={replyMessage}
                            onChange={e => setReplyMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Dear ${activeQuery.name},\n\nThank you for reaching out to Dwellr support...\n\n(Press Ctrl+Enter to send response email)`}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[100px] max-h-[220px] leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            Press{" "}
                            <kbd className="font-mono text-[9.5px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">
                              Ctrl+Enter
                            </kbd>{" "}
                            to send directly
                          </span>
                          <Button
                            type="button"
                            onClick={handleSendReply}
                            disabled={
                              !replyMessage.trim() || replyMutation.isPending
                            }
                            className="rounded-xl h-9 px-5 text-xs font-semibold gap-1.5 shadow-xs shrink-0"
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
                    </div>
                  )}

                  {/* TAB 2: TEAM NOTES */}
                  {activeTab === "notes" && (
                    <div className="space-y-4">
                      {activeQuery.internalNotes ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-150 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <StickyNote className="h-4 w-4 text-amber-500" />
                              Private Team Collaboration Notes
                            </span>
                            <span className="text-[10.5px] text-slate-400 font-medium">
                              Visible only to staff & admins
                            </span>
                          </div>

                          {activeQuery.internalNotes
                            .split("\n\n")
                            .map((noteChunk, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 shadow-2xs space-y-1.5"
                              >
                                <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-bold">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  <span>Note #{idx + 1}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                  {noteChunk}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 text-center text-slate-400 text-xs py-10 flex flex-col items-center gap-2">
                          <StickyNote className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">
                            No internal staff notes recorded yet.
                          </p>
                          <p className="text-[11px]">
                            Add private notes, customer context, or delegation
                            instructions below.
                          </p>
                        </div>
                      )}

                      {/* Add Note Form */}
                      <div className="bg-white dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MessageSquareText className="h-3.5 w-3.5 text-primary" />
                          Add New Team Note
                        </label>
                        <textarea
                          rows={3}
                          value={newStaffNote}
                          onChange={e => setNewStaffNote(e.target.value)}
                          placeholder="Add private instructions, customer call summary, or discount notes..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[85px] leading-relaxed"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveInternalNote}
                            disabled={
                              !newStaffNote.trim() ||
                              addInternalNoteMutation.isPending
                            }
                            className="rounded-xl h-8.5 px-4 text-xs font-semibold gap-1.5 shadow-xs"
                          >
                            {addInternalNoteMutation.isPending ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Save Note</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: AUDIT TRAIL */}
                  {activeTab === "timeline" && (
                    <div className="space-y-3.5">
                      {Array.isArray(activeQuery.activityLog) &&
                      activeQuery.activityLog.length > 0 ? (
                        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                          {activeQuery.activityLog.map((log, idx) => (
                            <div
                              key={idx}
                              className="relative text-xs space-y-1"
                            >
                              <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {log.action === "SUBMITTED"
                                    ? "Inquiry Submitted"
                                    : log.action === "TRANSFERRED"
                                      ? `Delegated to ${log.toName}`
                                      : log.action === "REPLIED"
                                        ? `Replied by ${log.byName}`
                                        : log.action === "PRIORITY_CHANGED"
                                          ? `Priority Changed to ${log.newPriority}`
                                          : log.action === "NOTE_ADDED"
                                            ? `Internal Note by ${log.byName}`
                                            : log.action}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {log.timestamp
                                    ? formatTimeAgo(log.timestamp)
                                    : ""}
                                </span>
                              </div>
                              {log.transferNote && (
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 italic">
                                  Note: {log.transferNote}
                                </p>
                              )}
                              {log.note && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                  {log.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs py-4 text-center">
                          Initial case created on{" "}
                          {new Date(activeQuery.createdAt).toLocaleString()}.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-2">
                <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">
                  Select an inquiry on the left
                </p>
                <p className="text-xs">
                  Click any conversation card to review and compose replies.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── DUAL VIEW: 2. TABULAR GRID VIEW ─────────────────────────────── */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-3 sm:px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : isSomeSelected ? (
                        <div className="h-4 w-4 rounded-xs border-2 border-primary bg-primary/20 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 bg-primary rounded-xs" />
                        </div>
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-3">Priority</th>

                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider text-[11px]"
                    >
                      Sender
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-4 max-w-xs sm:max-w-sm">
                    Inquiry / Subject
                  </th>

                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider text-[11px]"
                    >
                      Status
                      {sortBy === "status" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Reply Status</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs font-medium">
                          Loading inquiries...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : queries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <MailQuestion className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold">
                          No inquiries found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  queries.map(q => {
                    const isRowSelected = selectedIds.includes(q.id);
                    return (
                      <tr
                        key={q.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isRowSelected ? "bg-primary/5 dark:bg-primary/10" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRow(q.id)}
                            className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center mx-auto"
                          >
                            {isRowSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {getPriorityBadge(q.priority)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {q.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 dark:text-white truncate block">
                                  {q.name}
                                </span>
                                {q.isRegisteredUser &&
                                  (q.userId || q.user?.id) && (
                                    <Link
                                      href={`/dashboard/users/${q.userId || q.user?.id}`}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold transition-colors"
                                      title="View Registered User Details Page"
                                    >
                                      <span>Profile</span>
                                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                    </Link>
                                  )}
                              </div>
                              <span className="text-[10.5px] text-slate-400 truncate block">
                                {q.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {q.subject}
                          </p>
                          <p className="text-slate-500 text-[11px] line-clamp-1">
                            {q.message}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(q.status)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {q.assignedToName ? (
                            <span className="font-medium text-[11.5px] text-slate-800 dark:text-slate-200">
                              {q.assignedToName}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(q)}
                              className="text-[11px] text-slate-400 hover:text-primary"
                            >
                              + Assign
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {q.replyMessage ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              ✓ Replied
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11.5px]">
                          {formatTimeAgo(q.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReplyModal(q)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 text-primary hover:bg-primary/10"
                          >
                            <Reply className="h-3.5 w-3.5" />
                            <span>Reply</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {meta && meta.total > 0 && (
            <div className="py-4 px-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </span>
              <div className="flex items-center gap-1">
                {paginationRange.map((p, idx) => (
                  <Button
                    key={idx}
                    variant={p === meta.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => typeof p === "number" && setPage(p)}
                    disabled={typeof p !== "number"}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Super Admin Staff Permissions Modal ────────────────────────────── */}
      <Dialog
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
      >
        <DialogContent className="sm:max-w-2xl w-[95vw] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Key className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Staff Admin Privileges
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  As Super Admin, grant or restrict staff privileges for inquiry
                  deletion and user profile inspection.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 [scrollbar-width:thin] overscroll-contain">
              {staffMembers.map(staff => {
                const isMemberSuperAdmin =
                  staff.role === "super_admin" || staff.isOwner;
                return (
                  <div
                    key={staff.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {staff.profilePictureURL ? (
                        <img
                          src={staff.profilePictureURL}
                          alt={staff.name || "Staff"}
                          className="h-8.5 w-8.5 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="h-8.5 w-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {staff.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                            {staff.name || "Staff Member"}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9.5px] py-0 px-1.5 shrink-0"
                          >
                            {getRoleLabel(staff.role)}
                          </Badge>
                        </div>
                        <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                          {staff.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isMemberSuperAdmin ? (
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10.5px] gap-1 py-1 px-2.5 font-medium">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Super Admin (Full Access)
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {/* Delete Permission */}
                          <Button
                            type="button"
                            variant={
                              staff.canDeleteQueries ? "default" : "outline"
                            }
                            size="sm"
                            disabled={togglePermissionMutation.isPending}
                            onClick={() =>
                              handleToggleStaffDeletePermission(
                                staff.id,
                                Boolean(staff.canDeleteQueries),
                              )
                            }
                            className={`h-7 px-2.5 rounded-lg text-[11px] gap-1 font-semibold transition-all ${
                              staff.canDeleteQueries
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                            }`}
                            title="Toggle inquiry deletion privilege"
                          >
                            {staff.canDeleteQueries ? (
                              <>
                                <Unlock className="h-3 w-3" />
                                <span>Delete: Allowed</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span>Delete: Blocked</span>
                              </>
                            )}
                          </Button>

                          {/* View User Details Permission */}
                          <Button
                            type="button"
                            variant={
                              staff.canViewUserDetails ? "default" : "outline"
                            }
                            size="sm"
                            disabled={toggleUserDetailsMutation.isPending}
                            onClick={() =>
                              handleToggleStaffUserDetailsPermission(
                                staff.id,
                                Boolean(staff.canViewUserDetails),
                              )
                            }
                            className={`h-7 px-2.5 rounded-lg text-[11px] gap-1 font-medium transition-all ${
                              staff.canViewUserDetails
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                            }`}
                            title="Toggle user details viewing privilege"
                          >
                            {staff.canViewUserDetails ? (
                              <>
                                <UserCheck className="h-3 w-3" />
                                <span>Users: Allowed</span>
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 text-slate-400" />
                                <span>Users: Blocked</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={() => setPermissionsModalOpen(false)}
              className="rounded-xl h-8.5 px-5 text-xs font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── View & Reply Modal (For Table Mode) ────────────────────────────── */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl w-[95vw] h-[85vh] max-h-[850px] flex flex-col p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {activeQuery && (
            <div className="flex-1 flex flex-col h-full min-h-0">
              {/* Modal Header */}
              <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {activeQuery.subject}
                      </DialogTitle>
                      {getPriorityBadge(activeQuery.priority)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>
                        From: <strong>{activeQuery.name}</strong>
                      </span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(activeQuery.email)}
                        className="text-slate-400 hover:text-primary inline-flex items-center gap-1 text-[11px]"
                        title="Copy email"
                      >
                        <span>{activeQuery.email}</span>
                        <Copy className="h-3 w-3" />
                      </button>
                      {activeQuery.isRegisteredUser &&
                        (activeQuery.userId || activeQuery.user?.id ? (
                          <Link
                            href={`/dashboard/users/${activeQuery.userId || activeQuery.user?.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 border border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-semibold transition-colors shrink-0"
                            title="View registered user account profile"
                          >
                            <span>Registered User</span>
                            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                          </Link>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-600 text-[9.5px] py-0"
                          >
                            Registered User
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeQuery.isRegisteredUser &&
                      (activeQuery.userId || activeQuery.user?.id) && (
                        <Link
                          href={`/dashboard/users/${activeQuery.userId || activeQuery.user?.id}`}
                          target="_blank"
                          className="h-8 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold transition-colors"
                          title="View user details in new tab"
                        >
                          <User className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View Profile</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAssignModal(activeQuery)}
                      className="h-8 px-2.5 text-xs rounded-xl gap-1"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
                      <span>Transfer Case</span>
                    </Button>
                  </div>
                </div>

                {/* Sub Tabs inside Modal */}
                <div className="flex items-center gap-4 text-xs pt-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reply")}
                    className={`py-1 border-b-2 font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === "reply"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    <span>Conversation & Response</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className={`py-1 border-b-2 font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === "notes"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                    <span>Team Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("timeline")}
                    className={`py-1 border-b-2 font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === "timeline"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Audit Timeline</span>
                  </button>
                </div>
              </DialogHeader>

              {/* Modal Body with overscroll-contain */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] py-4 space-y-3.5">
                {activeTab === "reply" && (
                  <div className="space-y-3.5">
                    {/* Customer Message */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {activeQuery.name} wrote:
                        </span>
                        <span>
                          {new Date(activeQuery.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                        {activeQuery.message}
                      </div>
                    </div>

                    {/* Previous Reply */}
                    {activeQuery.replyMessage && (
                      <div className="space-y-1 pl-3 border-l-2 border-emerald-500">
                        <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Sent Reply by {activeQuery.repliedByName || "Admin"}
                          </span>
                          <span className="text-slate-400 text-[10.5px]">
                            {activeQuery.repliedAt
                              ? new Date(activeQuery.repliedAt).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                          {activeQuery.replyMessage}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-3.5">
                    {activeQuery.internalNotes ? (
                      <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 space-y-1.5">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5" />
                          Internal Notes Log:
                        </span>
                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {activeQuery.internalNotes}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-400 text-xs py-6">
                        No private team notes recorded yet.
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Add New Team Note:
                      </label>
                      <textarea
                        rows={3}
                        value={newStaffNote}
                        onChange={e => setNewStaffNote(e.target.value)}
                        placeholder="Add private instructions or customer call summary..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[70px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveInternalNote}
                          disabled={
                            !newStaffNote.trim() ||
                            addInternalNoteMutation.isPending
                          }
                          className="rounded-xl h-8 px-3 text-xs font-semibold"
                        >
                          {addInternalNoteMutation.isPending
                            ? "Saving..."
                            : "Save Note"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="space-y-3.5">
                    {Array.isArray(activeQuery.activityLog) &&
                    activeQuery.activityLog.length > 0 ? (
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                        {activeQuery.activityLog.map((log, idx) => (
                          <div key={idx} className="relative text-xs space-y-1">
                            <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {log.action === "SUBMITTED"
                                  ? "Inquiry Submitted"
                                  : log.action === "TRANSFERRED"
                                    ? `Delegated to ${log.toName}`
                                    : log.action === "REPLIED"
                                      ? `Replied by ${log.byName}`
                                      : log.action === "PRIORITY_CHANGED"
                                        ? `Priority Changed to ${log.newPriority}`
                                        : log.action === "NOTE_ADDED"
                                          ? `Internal Note by ${log.byName}`
                                          : log.action}
                              </span>
                              <span className="text-slate-400 text-[10px]">
                                {log.timestamp
                                  ? formatTimeAgo(log.timestamp)
                                  : ""}
                              </span>
                            </div>
                            {log.transferNote && (
                              <p className="text-[11px] text-blue-600 dark:text-blue-400 italic">
                                Note: {log.transferNote}
                              </p>
                            )}
                            {log.note && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                {log.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs py-4 text-center">
                        Initial case created on{" "}
                        {new Date(activeQuery.createdAt).toLocaleString()}.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Reply Composer Footer */}
              {activeTab === "reply" && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2.5">
                  {/* Preset Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Presets:
                    </span>
                    {CANNED_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.title}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="px-2.5 py-1 rounded-lg text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200/60 dark:border-slate-700/60 font-medium shrink-0 whitespace-nowrap"
                      >
                        + {tpl.title}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Input
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      placeholder="Subject for response email..."
                      className="rounded-xl text-xs h-8 bg-slate-50/50 dark:bg-slate-800/40"
                    />
                    <textarea
                      rows={4}
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Dear ${activeQuery.name},\n\nThank you for reaching out to Dwellr support...\n\n(Press Ctrl+Enter to send)`}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[120px] max-h-[220px] leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-slate-400 truncate">
                      Delivered to <strong>{activeQuery.email}</strong> •{" "}
                      <kbd className="font-mono text-[9.5px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">
                        Ctrl+Enter
                      </kbd>
                    </span>
                    <Button
                      type="button"
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || replyMutation.isPending}
                      className="rounded-xl h-8.5 px-4.5 text-xs font-semibold gap-1.5 shadow-xs shrink-0"
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Floating Sticky Bulk Actions Bar ───────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white dark:bg-slate-800/95 dark:text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-2xl w-[90vw]">
          <div className="flex items-center gap-2 font-bold shrink-0">
            <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            <span>Selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700 shrink-0" />

          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setBulkStaffId("");
                setBulkTransferNote("");
                setBulkAssignOpen(true);
              }}
              className="h-7.5 px-2.5 text-xs gap-1.5 rounded-xl font-semibold"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
              <span>Delegate</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7.5 px-2.5 text-xs gap-1.5 rounded-xl font-semibold"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Set Priority</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-40 rounded-xl text-xs"
              >
                <DropdownMenuItem onClick={() => handleBulkPriority("URGENT")}>
                  Urgent (🔴)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority("HIGH")}>
                  High (🟠)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority("MEDIUM")}>
                  Medium (🔵)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPriority("LOW")}>
                  Low (⚪)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7.5 px-2.5 text-xs gap-1.5 rounded-xl font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Set Status</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-40 rounded-xl text-xs"
              >
                <DropdownMenuItem onClick={() => handleBulkStatus("RESOLVED")}>
                  Mark Resolved
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkStatus("IN_PROGRESS")}
                >
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatus("PENDING")}>
                  Mark Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatus("CLOSED")}>
                  Mark Closed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-7.5 px-2.5 text-xs gap-1.5 rounded-xl font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-slate-400 hover:text-white text-xs shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* ─── Bulk Delegation Modal ────────────────────────────────────────── */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Bulk Delegate ({selectedIds.length} Selected)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign all selected inquiries to a staff member.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Assign to Team Member:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {staffMembers.map(staff => (
                  <div
                    key={staff.id}
                    onClick={() => setBulkStaffId(staff.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      bulkStaffId === staff.id
                        ? "bg-primary/10 border-primary font-semibold"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {staff.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <span className="truncate">
                        {staff.name || staff.email}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 px-1">
                      {getRoleLabel(staff.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Transfer Note / Instructions:
              </label>
              <Input
                value={bulkTransferNote}
                onChange={e => setBulkTransferNote(e.target.value)}
                placeholder="e.g. Batch assignment for customer inquiry follow-up..."
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkAssignOpen(false)}
              className="rounded-xl h-8.5 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmBulkAssign}
              disabled={!bulkStaffId || bulkActionMutation.isPending}
              className="rounded-xl h-8.5 text-xs font-semibold"
            >
              {bulkActionMutation.isPending
                ? "Assigning..."
                : "Assign Selected"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Transfer & Case Delegation Modal ──────────────────────────────── */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Transfer & Delegate Inquiry Case
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select a team member to handle this inquiry case.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {queryToAssign && (
            <div className="space-y-4 my-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                  {queryToAssign.subject}
                </p>
                <p className="text-slate-500 text-[11px]">
                  From: <strong>{queryToAssign.name}</strong> (
                  {queryToAssign.email})
                </p>
              </div>

              {/* Staff Member Selector */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Choose Assignee / Delegate:
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {staffMembers.map(staff => {
                    const isSelected = selectedStaffId === staff.id;
                    return (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {staff.profilePictureURL ? (
                            <img
                              src={staff.profilePictureURL}
                              alt={staff.name || "Staff"}
                              className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {staff.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                              {staff.name || "Staff Member"}
                            </p>
                            <p className="text-[10.5px] text-slate-400 truncate">
                              {staff.email}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className="text-[10px] py-0.5 px-2"
                        >
                          {getRoleLabel(staff.role)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transfer Note */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Internal Transfer Instructions:
                </label>
                <textarea
                  rows={2}
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  placeholder="e.g. Please follow up on custom contract discount pricing..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y min-h-[60px]"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              className="rounded-xl h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmAssignment}
              disabled={!selectedStaffId || assignMutation.isPending}
              className="rounded-xl h-9 px-5 text-xs gap-1.5 font-semibold shadow-xs"
            >
              {assignMutation.isPending ? "Assigning..." : "Confirm Delegation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Inquiry
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this user inquiry?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTarget && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 my-2 space-y-1 text-xs">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {deleteTarget.subject}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                From: <strong>{deleteTarget.name}</strong> ({deleteTarget.email}
                )
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl h-8.5 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="rounded-xl h-8.5 text-xs gap-2"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Inquiry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function QueriesPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      }
    >
      <QueriesPageContent />
    </Suspense>
  );
}
