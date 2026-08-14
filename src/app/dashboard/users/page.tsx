"use client";

import { useState } from "react";
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
  ChevronDown,
  Trash2,
  Loader2,
  X,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import Link from "next/link";

import { useGetAllUsers } from "@/features/users/hooks/use.users";
import { Admin } from "@/features/admin/types/admin.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { useDeleteUser } from "@/features/auth/hooks/user-delete-user";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import Image from "next/image";

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
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between gap-3 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0 ${accentColor}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {sub && (
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

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
          ? "text-primary"
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
          Remove <span className="text-rose-500">{admin.name || admin.email}</span>?
        </h3>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Are you sure you want to delete this user account? This action cannot be undone.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
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
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirm Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: userData } = useCurrentUser();
  const isCustomerSupport = userData?.data?.role === "customer_support";

  const { data, isLoading } = useGetAllUsers({
    page,
    limit,
    search,
    sortBy: sortField ?? undefined,
    sortOrder: sortDir ?? undefined,
  });

  const { mutate: deleteUser } = useDeleteUser();
  const users: Admin[] = data?.data?.directory ?? [];
  const meta = data?.data?.meta;

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

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteUser(deleteTarget.id);
    setDeleteTarget(null);
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-6 min-h-screen">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Platform Directory"
        title="Users & Members Directory"
        icon={Users}
      >
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
      </PageHeader>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Registered Users"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="users"
          accentColor="bg-primary/10 text-primary"
        />
        <StatCard
          icon={UserCheck}
          label="OTP Verified Users"
          value={meta?.otpVerifiedCount?.toLocaleString() ?? "—"}
          sub="verified"
          accentColor="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          icon={ShieldCheck}
          label="Paid Subscribers"
          value={meta?.paidCount?.toLocaleString() ?? "—"}
          sub="subscribers"
          accentColor="bg-sky-500/10 text-sky-600"
        />
        <StatCard
          icon={UserX}
          label="Guest Accounts"
          value={meta?.guestCount?.toLocaleString() ?? "—"}
          sub="guests"
          accentColor="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* ── Data Table Card ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-3.5">
                  <SortButton
                    label="User Name"
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
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map(u => {
                  const pal = avatarPalette(u.name ?? u.email ?? "");
                  const initials = (u.name ?? u.email ?? "??")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/users/${u.id}`}
                          className="flex items-center gap-3 group/link"
                        >
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-semibold text-xs border transition-transform group-hover/link:scale-105 ${pal.bg}`}
                          >
                            {u.profilePictureURL ? (
                              <Image
                                src={u.profilePictureURL}
                                alt=""
                                className="h-9 w-9 rounded-xl object-cover"
                                width={36}
                                height={36}
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover/link:text-primary transition-colors">
                            {u.name || "Anonymous User"}
                          </span>
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {u.email}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {new Date(u.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/users/${u.id}`}
                            title="View User Details"
                            className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Link>

                          {!isCustomerSupport && (
                            <button
                              disabled={deletingId === u.id}
                              onClick={() => {
                                setDeleteTarget(u);
                                setDeletingId(u.id);
                              }}
                              title="Delete User"
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
                    colSpan={4}
                    className="px-6 py-12 text-center text-xs font-medium text-slate-400"
                  >
                    No users found matching your search criteria.
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
              Showing page <span className="font-semibold text-slate-700 dark:text-slate-300">{meta.page}</span> of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{meta.totalPages}</span>
              &nbsp;·&nbsp; Total {meta.total} users
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
                className="h-8 rounded-xl border-slate-200 text-xs font-medium"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="h-8 rounded-xl border-slate-200 text-xs font-medium"
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
