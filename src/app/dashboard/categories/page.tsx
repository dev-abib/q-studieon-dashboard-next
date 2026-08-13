"use client";

import { useState, useRef, useEffect } from "react";
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
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { useGetAllCategories } from "@/features/categories/hooks/use-get-all-categories";
import { useCreateCategory } from "@/features/categories/hooks/use-create-category";
import { useUpdateCategory } from "@/features/categories/hooks/use-update-category";
import { useDeleteCategory } from "@/features/categories/hooks/use-delete-category";
import type { Category } from "@/features/categories/types/category.types";
import Image from "next/image";

type SortDir = "asc" | "desc" | null;
type SortField = "name" | "slug" | "createdAt";
const PER_PAGE_OPTIONS = [5, 8, 10, 20];

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
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between gap-3 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0 ${accent}`}>
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

// ─── Sort Button ───────────────────────────────────────────────────────────────
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
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
        active
          ? "text-primary"
          : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
      }`}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}

// ─── Per Page Select ───────────────────────────────────────────────────────────
function PerPageSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
        Rows
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 pl-3 pr-7 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

// ─── Outside Click Hook ────────────────────────────────────────────────────────
function useOutsideClick(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md">
      <div
        ref={panelRef}
        className={`relative my-auto w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Category Form Modal (Create / Edit) ──────────────────────────────────────
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
    initial?.icon ?? null
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
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Edit Category" : "New Category"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit ? `Updating: ${initial?.name}` : "Organize onsite reports & questions"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Category Name <span className="text-primary">*</span>
          </label>
          <Input
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="e.g. Architectural Property"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
          {nameError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {nameError}
            </p>
          )}
        </div>

        {/* Icon Upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Category Icon <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>

          {iconPreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
                  <Image
                    src={iconPreview}
                    alt="Category icon preview"
                    className="h-full w-full object-cover"
                    width={64}
                    height={64}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {iconFile?.name ?? "Current Category Icon"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {iconFile
                      ? `${(iconFile.size / 1024).toFixed(1)} KB`
                      : "Existing Icon Uploaded"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIconFile(null);
                    setIconPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FileImage className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Replace Icon Image
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/80 px-4 py-7 text-slate-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <ImageIcon className="h-7 w-7 text-primary" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Click to upload category icon
              </span>
              <span className="text-[11px] text-slate-400">
                Supports JPEG, PNG, or WebP (Max 5MB)
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

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="h-10.5 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10.5 px-5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {isEdit ? "Save Changes" : "Create Category"}
              </>
            )}
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
      <div className="p-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
          <Trash2 className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Delete Category?
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {category._count && category._count.questions > 0 ? (
            <>
              This category has <span className="font-semibold text-slate-700 dark:text-slate-300">{category._count.questions}</span> question{category._count.questions !== 1 ? "s" : ""} assigned to it. Please reassign them before deleting.
            </>
          ) : (
            <>
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">{category.name}</span>? This action cannot be undone.
            </>
          )}
        </p>

        <div className="mt-6 flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-10 rounded-xl bg-rose-500 text-xs font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Category"}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main Onsite Categories Component ──────────────────────────────────────────
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

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

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
        { onSuccess: () => setFormTarget(null) }
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
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Content Organization"
        title="Onsite Categories & Topics"
        icon={BookMarked}
        description="Manage categories, icon assets, and report classifications"
      >
        <Button
          type="button"
          onClick={() => setFormTarget("new")}
          className="h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Category
        </Button>
      </PageHeader>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={BookMarked}
          label="Total Categories"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="categories"
          accent="bg-primary/10 text-primary border-primary/20"
        />
        <StatCard
          icon={Eye}
          label="Assigned Questions"
          value={
            categories
              .reduce((acc, cat) => acc + (cat._count?.questions ?? 0), 0)
              .toLocaleString() ?? "—"
          }
          sub="active"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        />
        <StatCard
          icon={ImageIcon}
          label="With Icon Asset"
          value={categories.filter(c => c.icon).length.toLocaleString() ?? "—"}
          sub="configured"
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
        />
      </div>

      {/* ── Table Card Container ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              All Categories
            </h2>
            {meta && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {meta.total?.toLocaleString()} Total
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                placeholder="Search category name…"
                className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 pl-10 text-xs focus-visible:ring-primary"
                onChange={e => {
                  setSearch(e.target.value);
                  setPg(1);
                }}
              />
            </div>
            <PerPageSelect value={limit} onChange={handleLimitChange} />
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Category Name"
                    active={sortField === "name"}
                    dir={sortField === "name" ? sortDir : null}
                    onClick={() => handleSort("name")}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Slug Path"
                    active={sortField === "slug"}
                    dir={sortField === "slug" ? sortDir : null}
                    onClick={() => handleSort("slug")}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Created Date"
                    active={sortField === "createdAt"}
                    dir={sortField === "createdAt" ? sortDir : null}
                    onClick={() => handleSort("createdAt")}
                  />
                </th>
                <th className="px-6 py-3.5">Questions Count</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Category Name & Icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {cat.icon ? (
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <Image
                              src={cat.icon}
                              alt=""
                              className="h-full w-full object-cover"
                              width={36}
                              height={36}
                            />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <BookMarked className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4 font-mono text-primary text-xs">
                      /{cat.slug}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {new Date(cat.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Questions count */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {cat._count?.questions ?? 0} Questions
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormTarget(cat)}
                          title="Edit Category"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(cat)}
                          title="Delete Category"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing page <span className="font-bold text-slate-900 dark:text-white">{meta.page}</span> of {meta.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPg(p => p - 1)}
                className="h-8 px-3 rounded-lg text-xs font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPg(p => p + 1)}
                className="h-8 px-3 rounded-lg text-xs font-semibold"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {formTarget && (
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
    </div>
  );
}
