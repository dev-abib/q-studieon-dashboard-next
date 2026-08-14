"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Mail,
  Calendar,
  ShieldCheck,
  Users,
  UserPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  X,
  ShieldAlert,
  Headphones,
  FileText,
  DollarSign,
  Plus,
  CheckCircle2,
  UserCheck,
  Crown,
  Lock,
  Send,
  Eye,
  Shield,
  Sliders,
  Check,
  Info,
  KeyRound,
  FileBarChart2,
  MessageSquare,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { useGetAllAdmins } from "@/features/admin/hooks/user-get-all-admins";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { CreateAdminInput } from "@/features/auth/types/create-admin.types";
import { createAdminSchema } from "@/features/auth/schema/create-admin.schema";
import { useCreateAdmin } from "@/features/auth/hooks/use-create-admin";
import { useDeleteAdmin } from "@/features/auth/hooks/use-delete-admin";
import { useToggleUserDetailsPermission } from "@/features/contact-queries/hooks/use-toggle-user-details-permission";
import { useToggleDeletePermission } from "@/features/contact-queries/hooks/use-toggle-delete-permission";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner?: boolean;
  canDeleteQueries?: boolean | null;
  canViewUserDetails?: boolean | null;
  profilePictureURL: string | null;
  createdAt: string;
}

type SortField = "name" | "email" | "role" | "createdAt";
type SortDir = "asc" | "desc" | null;

// Avatar palette
const AVATAR_PALETTES = [
  { bg: "bg-primary/10 text-primary border-primary/20" },
  { bg: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
  { bg: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { bg: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { bg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
];

function avatarPalette(name: string) {
  return AVATAR_PALETTES[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];
}

// Role badge component
function RoleBadge({ role, isOwner }: { role: string; isOwner?: boolean }) {
  if (isOwner) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-primary/15 text-primary border-primary/30 shadow-2xs">
        <Crown className="h-3.5 w-3.5 text-primary fill-primary" />
        Site Owner
      </span>
    );
  }

  const getRoleConfig = (r: string) => {
    switch (r) {
      case "super_admin":
      case "superadmin":
        return {
          label: "Super Admin",
          icon: ShieldAlert,
          className:
            "bg-primary/10 text-primary border-primary/20",
        };
      case "customer_support":
        return {
          label: "Customer Support",
          icon: Headphones,
          className:
            "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20",
        };
      case "content_manager":
        return {
          label: "Content Manager",
          icon: FileText,
          className:
            "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/20",
        };
      case "finance":
        return {
          label: "Finance Manager",
          icon: DollarSign,
          className:
            "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20",
        };
      default:
        return {
          label: "Admin",
          icon: ShieldCheck,
          className:
            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

// Sort button helper
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
  const Icon = active
    ? dir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active
          ? "text-primary"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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

// Field Error Component
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-500 font-medium">{message}</p>;
}

// Delete Confirmation Modal
function DeleteModal({
  admin,
  onConfirm,
  onCancel,
  isLoading,
}: {
  admin: Admin;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          Revoke Access for <span className="text-rose-500">{admin.name}</span>?
        </h3>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {admin.email}
          </span>
          ? They will immediately lose all administrative privileges.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirm Revoke
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      role: "admin",
    },
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaffForPermissions, setSelectedStaffForPermissions] = useState<Admin | null>(null);
  const [inviteTab, setInviteTab] = useState<"invite" | "direct">("invite");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: currentUserRes } = useCurrentUser();
  const currentUser = currentUserRes?.data || currentUserRes;
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.isOwner;

  const { mutate: createAdmin } = useCreateAdmin();
  const { mutate: deleteAdmin } = useDeleteAdmin();
  const toggleUserDetailsMutation = useToggleUserDetailsPermission();
  const toggleDeleteMutation = useToggleDeletePermission();

  const { mutate: sendInvite, isPending: isInviting } = useMutation({
    mutationFn: authApi.inviteMember,
    onSuccess: data => {
      toast.success(data.message || "Invitation email sent successfully!");
      setInviteEmail("");
      setShowCreateModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    },
  });

  const { data, isLoading } = useGetAllAdmins({
    page,
    limit,
    search,
    sortBy: sortField ?? undefined,
    sortOrder: sortDir ?? undefined,
  });

  const rawAdmins: Admin[] = data?.data?.directory ?? [];
  const meta = data?.data?.meta;

  const admins = useMemo(() => {
    return rawAdmins.filter(admin => {
      if (roleFilter === "all") return true;
      if (roleFilter === "super_admin")
        return admin.role === "super_admin" || admin.role === "superadmin";
      return admin.role === roleFilter;
    });
  }, [rawAdmins, roleFilter]);

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

  function handleToggleUserDetails(admin: Admin) {
    if (!isSuperAdmin) {
      toast.error("Only Super Admins can configure staff permissions.");
      return;
    }
    const nextState = !Boolean(admin.canViewUserDetails);
    toggleUserDetailsMutation.mutate({
      staffId: admin.id,
      canViewUserDetails: nextState,
    });
  }

  function handleToggleDelete(admin: Admin) {
    if (!isSuperAdmin) {
      toast.error("Only Super Admins can configure staff permissions.");
      return;
    }
    const nextState = !Boolean(admin.canDeleteQueries);
    toggleDeleteMutation.mutate({
      staffId: admin.id,
      canDelete: nextState,
    });
  }

  function onCreateSubmit(values: CreateAdminInput) {
    createAdmin(values, {
      onSuccess: () => {
        reset();
        setShowCreateModal(false);
      },
    });
  }

  function onInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    sendInvite({ email: inviteEmail.trim(), role: inviteRole });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteAdmin(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setDeletingId(null);
      },
      onError: () => {
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="TEAM & ACCESS CONTROL"
        title="Admin & Team Management"
        icon={Users}
        description="Manage internal team members, assign operational roles, and centrally grant or revoke granular permissions across the platform."
      >
        <div className="flex items-center gap-2.5">
          {/* Centralized Permissions Button */}
          {isSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowPermissionsModal(true)}
              className="rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-bold h-10 px-4 gap-2 shadow-2xs"
            >
              <Shield className="h-4 w-4" />
              <span>Staff Access Matrix</span>
            </Button>
          )}

          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4 shadow-xs"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>
      </PageHeader>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-2xs backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Team
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {meta?.total ?? rawAdmins.length}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-2xs backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Super Admins
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {rawAdmins.filter(a => a.role === "super_admin" || a.isOwner).length}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-2xs backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Customer Support
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Headphones className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {rawAdmins.filter(a => a.role === "customer_support").length}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-2xs backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              User Details Granted
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {rawAdmins.filter(a => a.isOwner || a.role === "super_admin" || a.canViewUserDetails).length}
          </p>
        </div>
      </div>

      {/* ── Table Card & Filters ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm overflow-hidden backdrop-blur-sm">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl w-max overflow-x-auto [scrollbar-width:none]">
            {[
              { id: "all", label: "All Members" },
              { id: "admin", label: "Admins" },
              { id: "customer_support", label: "Support" },
              { id: "content_manager", label: "Content" },
              { id: "finance", label: "Finance" },
              { id: "super_admin", label: "Super Admins" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  roleFilter === tab.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              placeholder="Search by name or email…"
              className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 text-xs focus-visible:ring-primary"
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Member Name"
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
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Role"
                    active={sortField === "role"}
                    dir={sortField === "role" ? sortDir : null}
                    onClick={() => handleSort("role")}
                  />
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Granular Privileges
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Joined Date"
                    active={sortField === "createdAt"}
                    dir={sortField === "createdAt" ? sortDir : null}
                    onClick={() => handleSort("createdAt")}
                  />
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                    </td>
                  </tr>
                ))
              ) : admins.length > 0 ? (
                admins.map(admin => {
                  const pal = avatarPalette(admin.name ?? "");
                  const initials = (admin.name ?? "??")
                    .slice(0, 2)
                    .toUpperCase();
                  const isAdminSuper = admin.role === "super_admin" || admin.role === "superadmin" || admin.isOwner;
                  const canViewUsers = isAdminSuper || Boolean(admin.canViewUserDetails);
                  const canDeleteQ = isAdminSuper || Boolean(admin.canDeleteQueries);

                  return (
                    <tr
                      key={admin.id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-semibold text-xs border ${pal.bg}`}
                          >
                            {admin.profilePictureURL ? (
                              <Image
                                src={admin.profilePictureURL}
                                alt=""
                                className="h-9 w-9 rounded-xl object-cover"
                                width={36}
                                height={36}
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {admin.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {admin.email}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={admin.role} isOwner={admin.isOwner} />
                      </td>

                      {/* Granular Permissions Column */}
                      <td className="px-6 py-4">
                        {isAdminSuper ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                            <Crown className="h-3 w-3 fill-primary" />
                            All Privileges (Full Access)
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Toggle 1: View User Details */}
                            <button
                              type="button"
                              onClick={() => handleToggleUserDetails(admin)}
                              disabled={!isSuperAdmin || toggleUserDetailsMutation.isPending}
                              title={
                                canViewUsers
                                  ? "Click to revoke User Details viewing access"
                                  : "Click to grant User Details viewing access"
                              }
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                                canViewUsers
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              <Eye className="h-3 w-3" />
                              <span>View Users: {canViewUsers ? "Granted" : "Restricted"}</span>
                            </button>

                            {/* Toggle 2: Delete Contact Queries */}
                            <button
                              type="button"
                              onClick={() => handleToggleDelete(admin)}
                              disabled={!isSuperAdmin || toggleDeleteMutation.isPending}
                              title={
                                canDeleteQ
                                  ? "Click to revoke Contact Queries deletion access"
                                  : "Click to grant Contact Queries deletion access"
                              }
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                                canDeleteQ
                                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete Queries: {canDeleteQ ? "Granted" : "Restricted"}</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {new Date(admin.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Configure permissions modal trigger */}
                          {!isAdminSuper && isSuperAdmin && (
                            <button
                              onClick={() => setSelectedStaffForPermissions(admin)}
                              title="Configure granular permissions"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {admin.isOwner ? (
                            <span
                              title="Primary Site Owner (Protected)"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary opacity-80 cursor-not-allowed"
                            >
                              <Lock className="h-4 w-4 text-primary" />
                            </span>
                          ) : (
                            <button
                              disabled={deletingId === admin.id}
                              onClick={() => {
                                setDeleteTarget(admin);
                                setDeletingId(admin.id);
                              }}
                              title="Revoke Admin Access"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-xs font-medium text-slate-400"
                  >
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <strong>{page}</strong> of <strong>{meta.totalPages}</strong> ({meta.total} members)
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8 px-3 rounded-lg text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-8 px-3 rounded-lg text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Centralized Staff Access Matrix (All Members) ── */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="sm:max-w-2xl w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-primary">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Staff Permissions & Centralized Access Control
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Granularly grant or restrict staff access to user details, reports, billing, and support inquiry deletion.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {/* Privilege Guide Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Privilege Descriptions:</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 pl-6 list-disc leading-relaxed">
                <li>
                  <strong>View User Details (`canViewUserDetails`)</strong>: Grants ability to open user profile pages, view inspection reports, browse user collections, review payment history, and send direct emails.
                </li>
                <li>
                  <strong>Delete Contact Queries (`canDeleteQueries`)</strong>: Grants permission to permanently delete customer support inquiries and spam messages.
                </li>
              </ul>
            </div>

            {/* Staff List with Interactive Toggles */}
            <div className="space-y-2.5">
              {rawAdmins.map(staff => {
                const isSuper = staff.role === "super_admin" || staff.role === "superadmin" || staff.isOwner;
                const canView = isSuper || Boolean(staff.canViewUserDetails);
                const canDel = isSuper || Boolean(staff.canDeleteQueries);

                return (
                  <div
                    key={staff.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {staff.name}
                        </span>
                        <RoleBadge role={staff.role} isOwner={staff.isOwner} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        {staff.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isSuper ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold">
                          All Access Granted (Super Admin)
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Toggle View User Details */}
                          <button
                            type="button"
                            onClick={() => handleToggleUserDetails(staff)}
                            disabled={toggleUserDetailsMutation.isPending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              canView
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Users: {canView ? "ON" : "OFF"}</span>
                          </button>

                          {/* Toggle Delete Queries */}
                          <button
                            type="button"
                            onClick={() => handleToggleDelete(staff)}
                            disabled={toggleDeleteMutation.isPending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              canDel
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Queries: {canDel ? "ON" : "OFF"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPermissionsModal(false)}
              className="rounded-xl h-9 px-5 text-xs font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Individual Staff Permissions Editor ── */}
      <Dialog
        open={Boolean(selectedStaffForPermissions)}
        onOpenChange={open => !open && setSelectedStaffForPermissions(null)}
      >
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
          {selectedStaffForPermissions && (
            <div className="space-y-4 text-xs">
              <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                      Edit Permissions for {selectedStaffForPermissions.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      {selectedStaffForPermissions.email} • {selectedStaffForPermissions.role}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 pt-1">
                {/* 1. View User Details Switch */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      View User Details Page
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Browse user generated reports, collections, payments, and account status.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleToggleUserDetails(selectedStaffForPermissions);
                      setSelectedStaffForPermissions(prev =>
                        prev
                          ? {
                              ...prev,
                              canViewUserDetails: !prev.canViewUserDetails,
                            }
                          : null,
                      );
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      selectedStaffForPermissions.canViewUserDetails
                        ? "bg-primary"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        selectedStaffForPermissions.canViewUserDetails
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Delete Support Queries Switch */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      Delete Support Queries
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Allow permanently deleting contact messages & customer tickets.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDelete(selectedStaffForPermissions);
                      setSelectedStaffForPermissions(prev =>
                        prev
                          ? {
                              ...prev,
                              canDeleteQueries: !prev.canDeleteQueries,
                            }
                          : null,
                      );
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      selectedStaffForPermissions.canDeleteQueries
                        ? "bg-primary"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        selectedStaffForPermissions.canDeleteQueries
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStaffForPermissions(null)}
                  className="rounded-xl h-9 px-5 text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Create / Invite Member ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Team Member
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invite via email or create direct credentials
                </p>
              </div>
            </div>

            {/* Sub-tabs: Invite vs Direct */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setInviteTab("invite")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  inviteTab === "invite"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                Invite via Email (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setInviteTab("direct")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  inviteTab === "direct"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create Directly
              </button>
            </div>

            {inviteTab === "invite" ? (
              /* Invitation Form */
              <form onSubmit={onInviteSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recipient Email Address
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                  />
                  <p className="text-[11px] text-slate-400">
                    A secure invitation link will be sent to this email address.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    <option value="admin">Administrator (Full Operational Access)</option>
                    <option value="customer_support">
                      Customer Support (Support & Read Only)
                    </option>
                    <option value="content_manager">
                      Content Manager (Onsite Content & FAQs)
                    </option>
                    <option value="finance">
                      Finance Manager (Revenue & Financials)
                    </option>
                    <option value="super_admin">
                      Super Admin (Full Platform Access)
                    </option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isInviting}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 shadow-xs"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Invitation…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invitation Email
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* Direct Creation Form */
              <form onSubmit={handleSubmit(onCreateSubmit)} noValidate>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Full Name
                      </label>
                      <Input
                        {...register("name")}
                        placeholder="e.g. Sarah Connor"
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                      />
                      <FieldError message={errors.name?.message} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="member@example.com"
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                      />
                      <FieldError message={errors.email?.message} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Role
                    </label>
                    <select
                      {...register("role")}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
                    >
                      <option value="admin">Administrator (Full Operational Access)</option>
                      <option value="customer_support">
                        Customer Support (Support & Read Only)
                      </option>
                      <option value="content_manager">
                        Content Manager (Onsite Content & FAQs)
                      </option>
                      <option value="finance">
                        Finance Manager (Revenue & Financials)
                      </option>
                    </select>
                    <FieldError message={errors.role?.message} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <PasswordInput
                        {...register("password")}
                        placeholder="••••••••"
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                      />
                      <FieldError message={errors.password?.message} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </label>
                      <PasswordInput
                        {...register("confirmPassword")}
                        placeholder="••••••••"
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                      />
                      <FieldError message={errors.confirmPassword?.message} />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="rounded-xl border-slate-200 text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Member…
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Member
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Revoke Admin ── */}
      {deleteTarget && (
        <DeleteModal
          admin={deleteTarget}
          isLoading={deletingId === deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteTarget(null);
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
}
