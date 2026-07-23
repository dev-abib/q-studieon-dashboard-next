"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllInsights } from "@/features/insights/hooks/use-get-all-insights";
import { useCreateInsight } from "@/features/insights/hooks/use-create-insight";
import { useUpdateInsight } from "@/features/insights/hooks/use-update-insight";
import { useDeleteInsight } from "@/features/insights/hooks/use-delete-insight";
import type { Insight } from "@/features/insights/types/insight.types";
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
type SortField = "title" | "subTitle" | "createdAt";

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

// ─── Insight Form Modal (create / edit) ────────────────────────────────────────
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
  const [redirectLink, setRedirectLink] = useState(
    initial?.redirectLink ?? "",
  );
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    initial?.icon ?? null,
  );
  const [titleError, setTitleError] = useState("");
  const [subTitleError, setSubTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
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
    let hasError = false;

    if (!title.trim()) {
      setTitleError("Title is required");
      hasError = true;
    } else {
      setTitleError("");
    }

    if (!subTitle.trim()) {
      setSubTitleError("Subtitle is required");
      hasError = true;
    } else {
      setSubTitleError("");
    }

    if (!description.trim()) {
      setDescriptionError("Description is required");
      hasError = true;
    } else {
      setDescriptionError("");
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("subTitle", subTitle.trim());
    formData.append("description", description.trim());
    if (isEdit) {
      // Always send redirectLink on edit so the user can clear it
      formData.append("redirectLink", redirectLink.trim());
    } else if (redirectLink.trim()) {
      formData.append("redirectLink", redirectLink.trim());
    }
    if (iconFile) {
      formData.append("icon", iconFile);
    }
    onSave(formData);
  };

  return (
    <ModalBackdrop onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <h2
            className="text-lg font-normal text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {isEdit ? (
              <>
                Edit <em className="italic text-amber-600">Insight</em>
              </>
            ) : (
              <>
                New <em className="italic text-amber-600">Insight</em>
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
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Title
            </label>
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              placeholder="e.g. Property Insights"
              className={`h-10 rounded-xl text-sm text-stone-700 shadow-none ${
                titleError
                  ? "border-rose-300 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={titleError} />
          </div>

          {/* SubTitle */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Subtitle
            </label>
            <Input
              value={subTitle}
              onChange={e => {
                setSubTitle(e.target.value);
                if (subTitleError) setSubTitleError("");
              }}
              placeholder="e.g. Understand your property value"
              className={`h-10 rounded-xl text-sm text-stone-700 shadow-none ${
                subTitleError
                  ? "border-rose-300 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={subTitleError} />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (descriptionError) setDescriptionError("");
              }}
              placeholder="Get detailed analysis of your property..."
              rows={3}
              className={`w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-700 shadow-none transition-colors placeholder:text-stone-300 focus:outline-none focus:ring-1 ${
                descriptionError
                  ? "border-rose-300 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={descriptionError} />
          </div>

          {/* Redirect Link */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Redirect Link{" "}
              <span className="normal-case tracking-normal text-stone-300">
                (optional)
              </span>
            </label>
            <div className="relative">
              <ExternalLink className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <Input
                value={redirectLink}
                onChange={e => setRedirectLink(e.target.value)}
                placeholder="/properties/analysis"
                className="h-10 rounded-xl border-stone-200 pl-9 text-sm text-stone-700 shadow-none focus-visible:ring-amber-400"
              />
            </div>
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
                      alt="Insight icon preview"
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
            {isEdit ? "Save changes" : "Create insight"}
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
          Delete <em className="italic text-rose-500">{insight.title}</em>?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
          The insight &ldquo;
          <span className="font-medium text-stone-600">{insight.title}</span>
          &rdquo; will be permanently removed. This action cannot be undone.
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
            Delete insight
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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
        { onSuccess: () => setFormTarget(null) },
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
    <>
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
                Knowledge Center
              </p>
              <h1
                className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                All <em className="italic text-amber-600">Insights</em>
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <Input
                  value={search}
                  placeholder="Search insights…"
                  className="h-10 rounded-xl border-stone-200 bg-white pl-9 text-sm text-stone-700 shadow-sm placeholder:text-stone-300 focus-visible:ring-amber-400"
                  onChange={e => {
                    setSearch(e.target.value);
                    setPg(1);
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setFormTarget("new")}
                className="h-10 rounded-xl bg-amber-500 px-4 text-sm text-white shadow-none hover:bg-amber-600"
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Insight
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={Lightbulb}
              label="Total Insights"
              value={meta?.total?.toLocaleString() ?? "—"}
              sub="insights"
              accent="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={FileText}
              label="With Descriptions"
              value={
                insights.filter(i => i.description?.length > 0).length.toLocaleString() ?? "—"
              }
              sub="insights"
              accent="bg-sky-50 text-sky-600"
            />
            <StatCard
              icon={ImageIcon}
              label="With Icons"
              value={
                insights.filter(i => i.icon).length.toLocaleString() ?? "—"
              }
              sub="insights"
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
        </div>

        {/* ── Table ── */}
        <div className="mx-6 mb-5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-none items-center justify-between border-b border-stone-100 px-6 py-3">
            <h2
              className="text-base font-normal text-stone-700"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              All Insights
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
            <table className="w-full min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-stone-100 bg-stone-50/95 backdrop-blur-sm">
                  {(
                    [
                      { key: "title" as SortField, label: "Title" },
                      { key: "subTitle" as SortField, label: "Subtitle" },
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
                      Redirect
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
                ) : insights.length > 0 ? (
                  insights.map(insight => (
                    <tr
                      key={insight.id}
                      className="group border-b border-stone-100 transition-colors last:border-none hover:bg-stone-50/70"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {insight.icon ? (
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                              <Image
                                src={insight.icon}
                                alt=""
                                className="h-full w-full object-cover"
                                width={32}
                                height={32}
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                            </div>
                          )}
                          <span className="text-sm font-normal text-stone-800">
                            {insight.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-stone-500 line-clamp-1 max-w-[220px] block">
                          {insight.subTitle}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs tabular-nums text-stone-400">
                          {new Date(insight.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {insight.redirectLink ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-1 font-mono text-[10px] text-stone-400">
                            <ExternalLink className="h-2.5 w-2.5" />
                            {insight.redirectLink.substring(0, 24)}
                            {insight.redirectLink.length > 24 ? "..." : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFormTarget(insight)}
                            title="Edit insight"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(insight)}
                            title="Delete insight"
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
                        <Lightbulb className="mb-2 h-6 w-6 text-stone-200" />
                        No insights found
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
    </>
  );
}
