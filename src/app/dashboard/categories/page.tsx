"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  BookMarked,
  ImageIcon,
  FileImage,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllCategories } from "@/features/categories/hooks/use-get-all-categories";
import { useCreateCategory } from "@/features/categories/hooks/use-create-category";
import { useUpdateCategory } from "@/features/categories/hooks/use-update-category";
import { useDeleteCategory } from "@/features/categories/hooks/use-delete-category";
import type { Category } from "@/features/categories/types/category.types";
import Image from "next/image";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${accent}`}
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      <td colSpan={5} className="px-6 py-4">
        <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100" />
      </td>
    </tr>
  );
}

// ─── Sort ──────────────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc" | null;
type SortField = "name" | "slug" | "createdAt";

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

// ─── Per-page ──────────────────────────────────────────────────────────────────
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

// ─── Outside-click ─────────────────────────────────────────────────────────────
function useOutsideClick(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ─── Modal Backdrop ────────────────────────────────────────────────────────────
function ModalBackdrop({
  onClose,
  children,
  wide,
}: {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOutsideClick(panelRef as React.RefObject<HTMLElement>, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm">
      <div
        ref={panelRef}
        className={`relative my-auto w-full rounded-2xl border border-stone-200 bg-white shadow-2xl ${
          wide ? "max-w-lg" : "max-w-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Field Error ───────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[11px] text-rose-500">{message}</p>;
}

// ─── Category Form Modal (create / edit) ──────────────────────────────────────
function CategoryFormModal({
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: Category;
  onSave: (formData: FormData) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    initial?.icon ?? null,
  );
  const [nameError, setNameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    const reader = new FileReader();
    reader.onload = () => setIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Category name is required");
      return;
    }
    setNameError("");

    const formData = new FormData();
    formData.append("name", name.trim());
    if (iconFile) {
      formData.append("icon", iconFile);
    }
    onSave(formData);
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <BookMarked className="h-4 w-4 text-amber-600" />
          </div>
          <h2
            className="text-lg font-normal text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {isEdit ? (
              <>
                Edit <em className="italic text-amber-600">Category</em>
              </>
            ) : (
              <>
                New <em className="italic text-amber-600">Category</em>
              </>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Category Name
            </label>
            <Input
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="e.g. Favorite Color"
              className={`h-10 rounded-xl text-sm text-stone-700 shadow-none ${
                nameError
                  ? "border-rose-300 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={nameError} />
          </div>

          {/* Icon upload */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Icon Image{" "}
              <span className="normal-case tracking-normal text-stone-300">
                (optional)
              </span>
            </label>

            {iconPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                <div className="relative flex items-center gap-4 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
                    <Image
                      src={iconPreview}
                      alt="Category icon preview"
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-stone-700">
                      {iconFile?.name ?? "Current icon"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      {iconFile
                        ? `${(iconFile.size / 1024).toFixed(1)} KB`
                        : "Existing icon"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIconFile(null);
                      setIconPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-stone-200 py-2 text-[10px] font-medium text-stone-400 transition-colors hover:bg-stone-100 hover:text-amber-600"
                >
                  <FileImage className="h-3.5 w-3.5" />
                  Replace image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 px-4 py-6 text-stone-400 transition-colors hover:border-amber-300 hover:bg-amber-50/30 hover:text-amber-600"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs font-medium">
                  Click to upload icon
                </span>
                <span className="text-[10px] text-stone-300">
                  JPEG, PNG, or WebP &middot; Max 5MB
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="h-8 rounded-lg bg-amber-500 text-xs text-white shadow-none hover:bg-amber-600 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-3 w-3" />
            )}
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({
  category,
  onConfirm,
  onCancel,
  isLoading,
}: {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="p-6">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
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
          Delete <em className="italic text-rose-500">{category.name}</em>?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
          {category._count && category._count.questions > 0 ? (
            <>
              This category has{" "}
              <span className="font-medium text-stone-600">
                {category._count.questions}
              </span>{" "}
              question{category._count.questions !== 1 ? "s" : ""} linked to it.
              You must remove or reassign them before deleting.
            </>
          ) : (
            <>
              The category &ldquo;
              <span className="font-medium text-stone-600">{category.name}</span>
              &rdquo; will be permanently removed. This action cannot be undone.
            </>
          )}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className={`h-8 rounded-lg text-xs text-white shadow-none disabled:opacity-60 bg-rose-500 hover:bg-rose-600`}
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3 w-3" />
            )}
            Delete category
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [formTarget, setFormTarget] = useState<Category | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data, isLoading } = useGetAllCategories({
    page: pg,
    limit,
    search,
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const { mutate: createCategory, isPending: isCreating } =
    useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } =
    useUpdateCategory();
  const { mutate: deleteCategory, isPending: isDeleting } =
    useDeleteCategory();

  const categories: Category[] = data?.data?.categories ?? [];
  const meta = data?.data?.meta;

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      setSortField("createdAt");
      setSortDir("desc");
    }
  }

  function handleLimitChange(v: number) {
    setLimit(v);
    setPg(1);
  }

  function handleFormSave(formData: FormData) {
    if (formTarget === "new") {
      createCategory(formData, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updateCategory(
        { id: formTarget.id, formData },
        { onSuccess: () => setFormTarget(null) },
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <>
      <div className="flex flex-col gap-6 min-h-screen">
        {/* ── Top Header Banner ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Content Organization
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Onsite Categories & Topics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                placeholder="Search categories…"
                className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 text-xs focus-visible:ring-amber-500"
                onChange={e => {
                  setSearch(e.target.value);
                  setPg(1);
                }}
              />
            </div>
            <Button
              type="button"
              onClick={() => setFormTarget("new")}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-xs px-4 py-2.5 shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={BookMarked}
              label="Total Categories"
              value={meta?.total?.toLocaleString() ?? "—"}
              sub="categories"
              accent="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={Eye}
              label="Total Questions"
              value={
                categories
                  .reduce(
                    (acc, cat) => acc + (cat._count?.questions ?? 0),
                    0,
                  )
                  .toLocaleString() ?? "—"
              }
              sub="across all"
              accent="bg-sky-50 text-sky-600"
            />
            <StatCard
              icon={ImageIcon}
              label="With Icons"
              value={
                categories.filter(c => c.icon).length.toLocaleString() ?? "—"
              }
              sub="categories"
              accent="bg-teal-50 text-teal-600"
            />
          <StatCard
            icon={Layers}
            label="Current Page"
              value={meta ? `${meta.page}` : "—"}
              sub={meta ? `of ${meta.totalPages}` : undefined}
              accent="bg-violet-50 text-violet-600"
            />
          </div>

        {/* ── Table ── */}
        <div className="mx-6 mb-5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-none items-center justify-between border-b border-stone-100 px-6 py-3">
            <h2
              className="text-base font-normal text-stone-700"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              All Categories
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
            <table className="w-full min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-stone-100 bg-stone-50/95 backdrop-blur-sm">
                  {(
                    [
                      { key: "name" as SortField, label: "Name" },
                      { key: "slug" as SortField, label: "Slug" },
                      { key: "createdAt" as SortField, label: "Created" },
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
                      Questions
                    </span>
                  </th>
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
                ) : categories.length > 0 ? (
                  categories.map(cat => (
                    <tr
                      key={cat.id}
                      className="group border-b border-stone-100 transition-colors last:border-none hover:bg-stone-50/70"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {cat.icon ? (
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                              <Image
                                src={cat.icon}
                                alt=""
                                className="h-full w-full object-cover"
                                width={32}
                                height={32}
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                              <BookMarked className="h-4 w-4 text-amber-500" />
                            </div>
                          )}
                          <span className="text-sm font-normal text-stone-800">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs text-stone-400">
                          /{cat.slug}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs tabular-nums text-stone-400">
                          {new Date(cat.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 px-2.5 py-1 text-xs text-stone-500">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {cat._count?.questions ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFormTarget(cat)}
                            title="Edit category"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            title="Delete category"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-sm text-stone-400"
                    >
                      <div className="flex flex-col items-center">
                        <BookMarked className="mb-2 h-6 w-6 text-stone-200" />
                        No categories found
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col items-start gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-light text-stone-400">
              Page{" "}
              <span className="font-medium text-stone-600">{meta.page}</span> of{" "}
              <span className="font-medium text-stone-600">
                {meta.totalPages}
              </span>
              &nbsp;·&nbsp;
              <span className="font-medium text-stone-600">
                {meta.total?.toLocaleString()}
              </span>{" "}
              total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPg(p => p - 1)}
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPg(p => p + 1)}
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {formTarget !== null && (
        <CategoryFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleFormSave}
          onClose={() => setFormTarget(null)}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
