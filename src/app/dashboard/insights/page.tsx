"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Lightbulb,
  ImageIcon,
  FileImage,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  FileText,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { useGetAllInsights } from "@/features/insights/hooks/use-get-all-insights";
import { useCreateInsight } from "@/features/insights/hooks/use-create-insight";
import { useUpdateInsight } from "@/features/insights/hooks/use-update-insight";
import { useDeleteInsight } from "@/features/insights/hooks/use-delete-insight";
import type { Insight } from "@/features/insights/types/insight.types";
import Image from "next/image";

type SortDir = "asc" | "desc" | null;
type SortField = "title" | "subTitle" | "createdAt";
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
          wide ? "max-w-xl" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Insight Form Modal (Create / Edit) ────────────────────────────────────────
function InsightFormModal({
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: Insight;
  onSave: (formData: FormData) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subTitle, setSubTitle] = useState(initial?.subTitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [redirectLink, setRedirectLink] = useState(initial?.redirectLink ?? "");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initial?.icon ?? null
  );

  const [titleError, setTitleError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Insight title is required");
      return;
    }
    setTitleError("");

    const formData = new FormData();
    formData.append("title", title.trim());
    if (subTitle.trim()) formData.append("subTitle", subTitle.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (redirectLink.trim()) formData.append("redirectLink", redirectLink.trim());
    if (imageFile) formData.append("icon", imageFile);

    onSave(formData);
  };

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Edit Insight" : "Create New Insight"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit ? `Updating: ${initial?.title}` : "Add helpful platform tip or insight"}
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
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Title <span className="text-primary">*</span>
          </label>
          <Input
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            placeholder="e.g. Market Inspection Best Practices"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
          {titleError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {titleError}
            </p>
          )}
        </div>

        {/* Subtitle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Subtitle / Tagline
          </label>
          <Input
            value={subTitle}
            onChange={e => setSubTitle(e.target.value)}
            placeholder="e.g. Essential guide for field surveyors"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
        </div>

        {/* Link */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Resource Link (URL)
          </label>
          <Input
            value={redirectLink}
            onChange={e => setRedirectLink(e.target.value)}
            placeholder="https://dwellr.tech/resources/survey-guide"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm font-mono focus-visible:ring-primary dark:bg-slate-800/40"
          />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Cover / Banner Image
          </label>

          {imagePreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
                  <Image
                    src={imagePreview}
                    alt="Insight cover preview"
                    className="h-full w-full object-cover"
                    width={96}
                    height={64}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {imageFile?.name ?? "Current Insight Image"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {imageFile
                      ? `${(imageFile.size / 1024).toFixed(1)} KB`
                      : "Existing Cover Uploaded"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/80 px-4 py-5 text-slate-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <ImageIcon className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Click to upload cover image
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
                {isEdit ? "Save Changes" : "Create Insight"}
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
  insight,
  onConfirm,
  onCancel,
  isLoading,
}: {
  insight: Insight;
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
          Delete Insight?
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">&ldquo;{insight.title}&rdquo;</span>? This action cannot be undone.
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Insight"}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main Helpful Insights Component ───────────────────────────────────────────
export default function InsightsPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [formTarget, setFormTarget] = useState<Insight | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Insight | null>(null);

  const { data, isLoading } = useGetAllInsights({
    page: pg,
    limit,
    search,
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const { mutate: createInsight, isPending: isCreating } = useCreateInsight();
  const { mutate: updateInsight, isPending: isUpdating } = useUpdateInsight();
  const { mutate: deleteInsight, isPending: isDeleting } = useDeleteInsight();

  const insights: Insight[] = data?.data?.insights ?? [];
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
      createInsight(formData, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updateInsight(
        { id: formTarget.id, formData },
        { onSuccess: () => setFormTarget(null) }
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteInsight(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <section className="w-full flex flex-col gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Educational Content"
        title="Helpful Insights"
        icon={Lightbulb}
        description="Manage educational guides, articles, and resource cards for users"
      >
        <Button
          type="button"
          onClick={() => setFormTarget("new")}
          className="h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Insight
        </Button>
      </PageHeader>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Lightbulb}
          label="Total Insights"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="published"
          accent="bg-primary/10 text-primary border-primary/20"
        />
        <StatCard
          icon={ImageIcon}
          label="With Banner Image"
          value={insights.filter(i => i.icon).length.toLocaleString() ?? "—"}
          sub="insights"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        />
        <StatCard
          icon={LinkIcon}
          label="External Links"
          value={insights.filter(i => i.redirectLink).length.toLocaleString() ?? "—"}
          sub="resources"
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
        />
      </div>

      {/* ── Table Card Container ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              All Insights & Resources
            </h2>
            {meta && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {meta.total?.toLocaleString()} Total
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                placeholder="Search insights title…"
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
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Insight Title & Subtitle"
                    active={sortField === "title"}
                    dir={sortField === "title" ? sortDir : null}
                    onClick={() => handleSort("title")}
                  />
                </th>
                <th className="px-6 py-3.5">Resource Link</th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Created Date"
                    active={sortField === "createdAt"}
                    dir={sortField === "createdAt" ? sortDir : null}
                    onClick={() => handleSort("createdAt")}
                  />
                </th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : insights.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No insights found.
                  </td>
                </tr>
              ) : (
                insights.map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Title & Cover */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <Image
                              src={item.icon}
                              alt=""
                              className="h-full w-full object-cover"
                              width={56}
                              height={40}
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Lightbulb className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {item.title}
                          </span>
                          {item.subTitle && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.subTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Link */}
                    <td className="px-6 py-4">
                      {item.redirectLink ? (
                        <a
                          href={item.redirectLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline truncate max-w-[200px]"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {item.redirectLink}
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormTarget(item)}
                          title="Edit Insight"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete Insight"
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
                onClick={() => setPg(p => Math.max(1, p - 1))}
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
        <InsightFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleFormSave}
          onClose={() => setFormTarget(null)}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          insight={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </section>
  );
}
