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
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllAdmins } from "@/features/admin/hooks/user-get-all-admins";
import { CreateAdminInput } from "@/features/auth/types/create-admin.types";
import { createAdminSchema } from "@/features/auth/schema/create-admin.schema";
import { useCreateAdmin } from "@/features/auth/hooks/use-create-admin";
import { useDeleteAdmin } from "@/features/auth/hooks/use-delete-admin";

// Types 
interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePictureURL: string | null;
  createdAt: string;
}

//  Avatar palette 
const AVATAR_PALETTES = [
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
];
function avatarPalette(name: string) {
  return AVATAR_PALETTES[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];
}

// Role badge 
const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-amber-50 text-amber-800 border border-amber-200",
  admin: "bg-slate-50 text-slate-600 border border-slate-200",
};
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-medium tracking-wide capitalize ${ROLE_STYLES[role] ?? ROLE_STYLES.admin}`}
    >
      {role}
    </span>
  );
}

//  Stat card 
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
          className="mt-0.5 text-2xl font-normal leading-none text-stone-800"
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

//  Skeleton row 
function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      <td colSpan={5} className="px-6 py-4">
        <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100" />
      </td>
    </tr>
  );
}

//  Sort 
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
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${active ? "text-amber-600" : "text-stone-400 hover:text-stone-600"}`}
    >
      {label}
      <Icon
        className={`h-3 w-3 ${active ? "text-amber-500" : "text-stone-300"}`}
      />
    </button>
  );
}

//  Per-page select 
const PER_PAGE_OPTIONS = [5, 8, 10, 20];
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
          className="h-8 appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-7 text-xs text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-300"
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

//  Field error helper 
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-rose-500">{message}</p>;
}

// Delete confirm modal 
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
          Remove <em className="italic text-rose-500">{admin.name}</em>?
        </h3>
        <p className="mt-1.5 text-sm text-stone-400">
          This will permanently revoke admin access for{" "}
          <span className="font-medium text-stone-600">{admin.email}</span>.
          This action cannot be undone.
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
            Remove admin
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
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutate: createAdmin } = useCreateAdmin();
  const { mutate: deleteAdmin } = useDeleteAdmin();

  const { data, isLoading } = useGetAllAdmins({
    page,
    limit,
    search,
    sortBy: sortField ?? undefined,
    sortOrder: sortDir ?? undefined,
  });

  const admins: Admin[] = data?.data?.directory ?? [];
  const meta = data?.data?.meta;

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

  function handleLimitChange(v: number) {
    setLimit(v);
    setPage(1);
  }

  const onCreateSubmit = async (values: CreateAdminInput) => {
    createAdmin(values);
    reset();
  };

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteAdmin(deletingId as string);
    setDeleteTarget(null);
    setDeletingId(null);
  }

  return (
    <div
      className="flex h-auto flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="flex-none space-y-5 px-6 pb-4 pt-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-600">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Admin Center
            </p>
            <h1
              className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              All <em className="italic text-amber-600">Admins</em>
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
            label="Total Admins"
            value={meta?.total?.toLocaleString() ?? "—"}
            sub="accounts"
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            icon={ShieldCheck}
            label="Verified"
            value={meta?.otpVerifiedCount?.toLocaleString() ?? "—"}
            sub="accounts"
            accent="bg-rose-50 text-rose-500"
          />
          <StatCard
            icon={Users}
            label="Guest"
            value={meta?.guestCount?.toLocaleString() ?? "—"}
            sub="accounts"
            accent="bg-teal-50 text-teal-600"
          />
          <StatCard
            icon={UserPlus}
            label="Current Page"
            value={meta ? `${meta.page}` : "—"}
            sub={meta ? `of ${meta.totalPages}` : undefined}
            accent="bg-sky-50 text-sky-600"
          />
        </div>
      </div>

      {/* ── Create admin card ── */}
      <div className="mx-6 mb-5 rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-3">
          <h2
            className="text-base font-normal text-stone-700"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Create New Admin
          </h2>
        </div>

        {/* RHF form — handleSubmit validates via zod before calling onCreateSubmit */}
        <form onSubmit={handleSubmit(onCreateSubmit)} noValidate>
          <div className="space-y-3 px-6 py-5">
            {/* Row 1: name + email */}
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Full name
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Jane Smith"
                  className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Email address
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="admin@example.com"
                  className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
                />
                <FieldError message={errors.email?.message} />
              </div>
            </div>

            {/* Row 2: password + confirm + submit */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Password
                </label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
                />
                <FieldError message={errors.password?.message} />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Confirm password
                </label>
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="••••••••"
                  className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
                />
                <FieldError message={errors.confirmPassword?.message} />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 rounded-lg bg-amber-500 px-5 text-xs font-medium text-white shadow-none hover:bg-amber-600 disabled:opacity-60 md:mt-[22px] md:self-start"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Create Admin
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Table ── */}
      <div className="mx-6 flex max-h-[350px] pb-5 flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
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

        <div className="flex-1 overflow-auto">
          <table className="w-full  min-w-[720px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-stone-100 bg-stone-50/95 backdrop-blur-sm">
                {(
                  [
                    { key: "name", label: "Admin" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role" },
                    { key: "createdAt", label: "Joined" },
                  ] as { key: SortField; label: string }[]
                ).map(col => (
                  <th key={col.key} className="px-6 py-3 text-left">
                    <SortButton
                      label={col.label}
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
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <SkeletonRow key={i} />
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
                      className="group border-b border-stone-100 transition-colors last:border-none hover:bg-stone-50/70"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-medium ring-1 ${pal.bg} ${pal.text} ${pal.ring}`}
                          >
                            {initials}
                          </span>
                          <span className="text-sm font-normal text-stone-800">
                            {admin.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-stone-400">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0 text-stone-300" />
                          {admin.email}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <RoleBadge role={admin.role} />
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs tabular-nums text-stone-400">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-stone-300" />
                          {new Date(admin.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          disabled={deletingId === admin.id}
                          onClick={() => {
                            setDeleteTarget(admin);
                            setDeletingId(admin.id);
                          }}
                          title={"Remove admin"}
                          className="flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-sm text-stone-400"
                  >
                    No admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {meta && (
        <div className="flex flex-none flex-col items-start gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-light text-stone-400">
            Showing page{" "}
            <span className="font-medium text-stone-600">{meta.page}</span> of{" "}
            <span className="font-medium text-stone-600">
              {meta.totalPages}
            </span>
            &nbsp;·&nbsp;
            <span className="font-medium text-stone-600">
              {meta.total?.toLocaleString()}
            </span>{" "}
            total admins
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevPage}
              onClick={() => setPage(p => p - 1)}
              className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
            >
              Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          admin={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deletingId !== deleteTarget.id}
        />
      )}
    </div>
  );
}
