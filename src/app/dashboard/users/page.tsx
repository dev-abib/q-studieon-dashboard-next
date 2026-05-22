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
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Trash2,
  Loader2,
  X,
  Eye,
} from "lucide-react";

import { useGetAllUsers } from "@/features/users/hooks/use.users";
import { Admin } from "@/features/admin/types/admin.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteUser } from "@/features/auth/hooks/user-delete-user";
import Image from "next/image";
import { useRouter } from "next/navigation";

const AVATAR_PALETTES = [
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
];

function avatarPalette(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-amber-50 text-amber-800 border border-amber-200",
  mod: "bg-rose-50  text-rose-800  border border-rose-200",
  user: "bg-slate-50 text-slate-600 border border-slate-200",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-medium tracking-wide capitalize ${
        ROLE_STYLES[role] ?? ROLE_STYLES.user
      }`}
    >
      {role}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
          {label}
        </p>
        <p
          className="mt-0.5 font-['DM_Serif_Display',serif] text-2xl font-normal leading-none text-stone-800"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {value}
          {sub && (
            <span
              className="ml-1.5 text-xs font-normal text-amber-600"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {sub}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      <td colSpan={4} className="px-6 py-4">
        <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100" />
      </td>
    </tr>
  );
}

type SortDir = "asc" | "desc" | null;

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  field: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon =
    !active || dir === null ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
        active ? "text-amber-600" : "text-stone-400 hover:text-stone-600"
      }`}
    >
      {label}
      <Icon
        className={`h-3 w-3 ${active ? "text-amber-500" : "text-stone-300"}`}
      />
    </button>
  );
}

const PER_PAGE_OPTIONS = [5, 8, 10, 20, 50];

function PerPageSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs text-stone-400">Rows</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-7 text-xs text-stone-600 shadow-none focus:outline-none focus:ring-1 focus:ring-amber-300"
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
      </div>
    </div>
  );
}

type SortField = "name" | "email" | "role" | "createdAt";

function DeleteModal({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: Admin;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
          <Trash2 className="h-5 w-5 text-rose-500" />
        </div>
        <h3
          className="mt-4 text-lg font-normal text-stone-800"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Remove <em className="italic text-rose-500">{user.name}</em>?
        </h3>
        <p className="mt-1.5 text-sm text-stone-400">
          This will permanently revoke all access for{" "}
          <span className="font-medium text-stone-600">{user.email}</span>. This
          action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className="h-8 rounded-lg bg-rose-500 text-xs text-white shadow-none hover:bg-rose-600 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3 w-3" />
            )}
            Remove user
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    } else if (sortDir === "desc") {
      setSortField(null);
      setSortDir(null);
    }
  }

  function handleLimitChange(v: number) {
    setLimit(v);
    setPage(1);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteUser(deletingId as string);
    setDeleteTarget(null);
    setDeletingId(null);
  }

  return (
    <>
      <div
        className="flex h-auto flex-col "
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex-none space-y-5  pb-4 pt-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-600">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Platform Console
              </p>
              <h1
                className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                User <em className="italic text-amber-600">Directory</em>
              </h1>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <Input
                value={search}
                placeholder="Search by name or email…"
                className="h-10 rounded-xl border-stone-200 bg-white pl-9 text-sm text-stone-700 shadow-sm placeholder:text-stone-300 focus-visible:ring-amber-400"
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={meta?.total?.toLocaleString() ?? "—"}
              sub="registered"
              accent="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={ShieldCheck}
              label="Verified users"
              value={meta?.otpVerifiedCount?.toLocaleString() ?? "—"}
              sub="accounts"
              accent="bg-rose-50 text-rose-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Guest users "
              value={meta?.guestCount?.toLocaleString() ?? "—"}
              sub="joined"
              accent="bg-teal-50 text-teal-600"
            />
            <StatCard
              icon={BookOpen}
              label="Current Page"
              value={meta ? `${meta.page}` : "—"}
              sub={meta ? `of ${meta.totalPages}` : undefined}
              accent="bg-sky-50 text-sky-600"
            />
          </div>
        </div>

        {/* ── Scrollable table area ── */}
        <div className=" flex pb-5 max-h-112.5 flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200  shadow-sm">
          {/* Table toolbar (fixed within card) */}
          <div className="flex flex-none items-center justify-between border-b border-stone-100 px-6 py-3">
            <h2
              className="text-base font-normal text-stone-700"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              All Members
            </h2>
            <div className="flex items-center gap-4">
              {meta && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">
                  {meta.total?.toLocaleString()} total
                </span>
              )}
              <PerPageSelect value={limit} onChange={handleLimitChange} />
            </div>
          </div>

          {/* Scrollable table */}
          <div className=" flex-1  overflow-auto">
            <table className="w-full min-w-170">
              {/* Sticky thead */}
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-stone-100 bg-stone-50/95 backdrop-blur-sm">
                  {(
                    [
                      { key: "name", label: "Member" },
                      { key: "email", label: "Email" },
                      { key: "role", label: "Role" },
                      { key: "createdAt", label: "Joined" },
                    ] as { key: SortField; label: string }[]
                  ).map(col => (
                    <th key={col.key} className="px-6 py-3 text-left">
                      <SortButton
                        label={col.label}
                        field={col.key}
                        active={sortField === col.key}
                        dir={sortField === col.key ? sortDir : null}
                        onClick={() => handleSort(col.key)}
                      />
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                      Actions
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                      view user
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : users.length > 0 ? (
                  users.map(user => {
                    const pal = avatarPalette(user.name ?? "");
                    const initials = (user.name ?? "??")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr
                        key={user.id}
                        className="group border-b border-stone-100 transition-colors last:border-none hover:bg-stone-50/70"
                      >
                        {/* Name */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ring-1 ${pal.bg} ${pal.text} ${pal.ring}`}
                            >
                              {user.profilePictureURL ? (
                                <Image
                                  src={user.profilePictureURL}
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover"
                                  width={32}
                                  height={32}
                                />
                              ) : (
                                initials
                              )}
                            </span>
                            <span className="text-sm font-normal text-stone-800">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-stone-400">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                            {user.email}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Date */}
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs tabular-nums text-stone-400">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                            {new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => {
                              setDeleteTarget(user);
                              setDeletingId(user.id);
                            }}
                            title={"Remove user"}
                            className="flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => {
                              router.push(`/dashboard/users/${user?.id}`);
                            }}
                            title={"See user details"}
                            className="flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-[#e576008f] hover:bg-[#f3953863] hover:text-[#e57800] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-16 text-center text-sm text-stone-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Fixed pagination ── */}
        {meta && (
          <div className="flex flex-none flex-col items-start gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-light text-stone-400">
              Showing page{" "}
              <span className="font-medium text-stone-600">{meta.page}</span> of{" "}
              <span className="font-medium text-stone-600">
                {meta.totalPages}
              </span>{" "}
              &nbsp;·&nbsp;{" "}
              <span className="font-medium text-stone-600">
                {meta.total?.toLocaleString()}
              </span>{" "}
              total users
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage(p => p - 1)}
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
              >
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {deleteTarget && (
          <DeleteModal
            user={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            isLoading={deletingId !== deleteTarget.id}
          />
        )}
      </div>
    </>
  );
}
