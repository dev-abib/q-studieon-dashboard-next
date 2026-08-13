"use client";

import { useState } from "react";
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
  ChevronDown,
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
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllAdmins } from "@/features/admin/hooks/user-get-all-admins";
import { CreateAdminInput } from "@/features/auth/types/create-admin.types";
import { createAdminSchema } from "@/features/auth/schema/create-admin.schema";
import { useCreateAdmin } from "@/features/auth/hooks/use-create-admin";
import { useDeleteAdmin } from "@/features/auth/hooks/use-delete-admin";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";

// Types
interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner?: boolean;
  profilePictureURL: string | null;
  createdAt: string;
}

// Avatar palette
const AVATAR_PALETTES = [
  { bg: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-sm">
        <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
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
            "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20",
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
            "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20",
        };
      case "finance":
        return {
          label: "Finance Manager",
          icon: DollarSign,
          className:
            "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/20",
        };
      default:
        return {
          label: "Administrator",
          icon: ShieldCheck,
          className:
            "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/20",
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

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${accentColor}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </span>
          {sub && (
            <span className="text-xs font-medium text-slate-400 truncate">
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Sort Button Component
type SortDir = "asc" | "desc" | null;
type SortField = "name" | "email" | "role" | "createdAt";

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
          ? "text-amber-600 dark:text-amber-400"
          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {label}
      <Icon
        className={`h-3.5 w-3.5 ${
          active ? "text-amber-500" : "text-slate-300 dark:text-slate-600"
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

        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
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
  const [inviteTab, setInviteTab] = useState<"invite" | "direct">("invite");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutate: createAdmin } = useCreateAdmin();
  const { mutate: deleteAdmin } = useDeleteAdmin();

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

  const admins = rawAdmins.filter(admin => {
    if (roleFilter === "all") return true;
    if (roleFilter === "super_admin")
      return admin.role === "super_admin" || admin.role === "superadmin";
    return admin.role === roleFilter;
  });

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      setSortField(null);
      setSortDir(null);
    }
  }

  const onCreateSubmit = async (values: CreateAdminInput) => {
    createAdmin(values);
    reset();
    setShowCreateModal(false);
  };

  const handleSendInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    sendInvite({ email: inviteEmail, role: inviteRole });
  };

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteAdmin(deleteTarget.id);
    setDeleteTarget(null);
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-6 min-h-screen">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Admin & Team Governance
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team Directory & Roles
          </h1>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-xs px-5 py-2.5 shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 transition-all"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add / Invite Team Member
        </Button>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Team Members"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="accounts"
          accentColor="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          icon={UserCheck}
          label="Verified Status"
          value={meta?.otpVerifiedCount?.toLocaleString() ?? "—"}
          sub="verified"
          accentColor="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          icon={Headphones}
          label="Support Members"
          value={
            rawAdmins
              .filter(a => a.role === "customer_support")
              .length.toString() || "0"
          }
          sub="active support"
          accentColor="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          icon={ShieldCheck}
          label="Administrators"
          value={
            rawAdmins
              .filter(a => a.role === "admin" || a.role === "super_admin")
              .length.toString() || "0"
          }
          sub="admin privileges"
          accentColor="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* ── Add / Invite Team Member Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Add Team Member
                  </h2>
                  <p className="text-xs text-slate-400">
                    Invite via email link or create account directly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-5">
              <button
                onClick={() => setInviteTab("invite")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  inviteTab === "invite"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Send className="h-3.5 w-3.5 text-amber-500" />
                Send Email Invitation
              </button>
              <button
                onClick={() => setInviteTab("direct")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  inviteTab === "direct"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                Direct Account Creation
              </button>
            </div>

            {inviteTab === "invite" ? (
              /* Email Invitation Form */
              <form onSubmit={handleSendInviteSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Invited Email Address
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
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
                    className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-5 shadow-md shadow-amber-500/20"
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
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
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
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
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
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      <Input
                        {...register("password")}
                        type="password"
                        placeholder="••••••••"
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
                      />
                      <FieldError message={errors.password?.message} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </label>
                      <Input
                        {...register("confirmPassword")}
                        type="password"
                        placeholder="••••••••"
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
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
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-5 shadow-md shadow-amber-500/20"
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

      {/* ── Table Card & Filters ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm overflow-hidden backdrop-blur-sm">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl w-max">
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  roleFilter === tab.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
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
              className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 text-xs focus-visible:ring-amber-500"
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
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Joined Date"
                    active={sortField === "createdAt"}
                    dir={sortField === "createdAt" ? sortDir : null}
                    onClick={() => handleSort("createdAt")}
                  />
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
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

                  return (
                    <tr
                      key={admin.id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs border ${pal.bg}`}
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
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {admin.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {admin.email}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={admin.role} isOwner={admin.isOwner} />
                      </td>

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {new Date(admin.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {admin.isOwner ? (
                          <span
                            title="Primary Site Owner (Protected)"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 opacity-80 cursor-not-allowed"
                          >
                            <Lock className="h-4 w-4 text-amber-500" />
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
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-xs font-medium text-slate-400"
                  >
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page <span className="font-bold text-slate-800 dark:text-slate-200">{meta.page}</span> of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{meta.totalPages}</span>
              &nbsp;·&nbsp; Total {meta.total} members
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
                className="h-8 rounded-xl border-slate-200 text-xs font-semibold"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="h-8 rounded-xl border-slate-200 text-xs font-semibold"
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          admin={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deletingId !== null}
        />
      )}
    </div>
  );
}
