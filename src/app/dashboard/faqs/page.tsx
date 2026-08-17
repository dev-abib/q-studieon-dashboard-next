"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  HelpCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Hash,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { useGetAllFaqs } from "@/features/faq/hooks/use-get-all-faqs";
import { useCreateFaq } from "@/features/faq/hooks/use-create-faq";
import { useUpdateFaq } from "@/features/faq/hooks/use-update-faq";
import { useDeleteFaq } from "@/features/faq/hooks/use-delete-faq";
import type { Faq } from "@/features/faq/types/faq.types";

type SortDir = "asc" | "desc" | null;
type SortField = "title" | "sortOrder" | "createdAt";
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

// ─── FAQ Form Modal (Create / Edit) ────────────────────────────────────────────
function FaqFormModal({
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: Faq;
  onSave: (payload: { title: string; description: string; sortOrder?: number }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 0);

  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!title.trim()) {
      setTitleError("Question title is required");
      valid = false;
    } else setTitleError("");

    if (!description.trim()) {
      setDescError("Answer text is required");
      valid = false;
    } else setDescError("");

    if (!valid) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder) || 0,
    });
  };

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Edit FAQ Item" : "Create FAQ Item"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit ? `Updating question: ${initial?.title}` : "Add frequently asked question & answer"}
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
            Question Title <span className="text-primary">*</span>
          </label>
          <Input
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (titleError) setTitleError("");
            }}
            placeholder="e.g. How does the subscription plan work?"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
          {titleError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {titleError}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Answer Description <span className="text-primary">*</span>
          </label>
          <textarea
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              if (descError) setDescError("");
            }}
            rows={4}
            placeholder="Write clear, detailed answer text…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 dark:bg-slate-800/40"
          />
          {descError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {descError}
            </p>
          )}
        </div>

        {/* Sort Order */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Display Sort Order Priority
          </label>
          <Input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            placeholder="0"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
        </div>

        {/* Action Buttons */}
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
                Saving FAQ...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {isEdit ? "Save Changes" : "Create FAQ"}
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
  faq,
  onConfirm,
  onCancel,
  isLoading,
}: {
  faq: Faq;
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
          Delete FAQ Item?
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">&ldquo;{faq.title}&rdquo;</span>? This action cannot be undone.
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete FAQ"}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main FAQs Component ───────────────────────────────────────────────────────
export default function FaqsPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [formTarget, setFormTarget] = useState<Faq | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  const { data, isLoading } = useGetAllFaqs({
    page: pg,
    limit,
    search,
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const { mutate: createFaq, isPending: isCreating } = useCreateFaq();
  const { mutate: updateFaq, isPending: isUpdating } = useUpdateFaq();
  const { mutate: deleteFaq, isPending: isDeleting } = useDeleteFaq();

  const faqs: Faq[] = data?.data?.faqs ?? [];
  const meta = data?.data?.meta;

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      setSortField("sortOrder");
      setSortDir("asc");
    }
  }

  function handleLimitChange(v: number) {
    setLimit(v);
    setPg(1);
  }

  function handleFormSave(payload: { title: string; description: string; sortOrder?: number }) {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    if (payload.sortOrder !== undefined) {
      formData.append("sortOrder", String(payload.sortOrder));
    }

    if (formTarget === "new") {
      createFaq(formData, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updateFaq(
        { id: formTarget.id, formData },
        { onSuccess: () => setFormTarget(null) }
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteFaq(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <section className="w-full flex flex-col gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Support Directory"
        title="Frequently Asked Questions"
        icon={HelpCircle}
        description="Manage system FAQs, answers, and display order priority"
      >
        <Button
          type="button"
          onClick={() => setFormTarget("new")}
          className="h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      </PageHeader>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={HelpCircle}
          label="Total FAQs"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="items"
          accent="bg-primary/10 text-primary border-primary/20"
        />
        <StatCard
          icon={Hash}
          label="Highest Priority Order"
          value={faqs.length > 0 ? `${Math.min(...faqs.map(f => f.sortOrder))}` : "—"}
          sub="order"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        />
      </div>

      {/* ── Table Card Container ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              All FAQs
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
                placeholder="Search FAQ title…"
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
                    label="Question Title & Answer"
                    active={sortField === "title"}
                    dir={sortField === "title" ? sortDir : null}
                    onClick={() => handleSort("title")}
                  />
                </th>
                <th className="px-6 py-3.5">
                  <SortButton
                    label="Priority Order"
                    active={sortField === "sortOrder"}
                    dir={sortField === "sortOrder" ? sortDir : null}
                    onClick={() => handleSort("sortOrder")}
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
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No FAQs found.
                  </td>
                </tr>
              ) : (
                faqs.map(faq => (
                  <tr
                    key={faq.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Title & Answer */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 max-w-lg">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {faq.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {faq.description}
                        </span>
                      </div>
                    </td>

                    {/* Priority Order */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        #{faq.sortOrder}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {new Date(faq.createdAt).toLocaleDateString("en-US", {
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
                          onClick={() => setFormTarget(faq)}
                          title="Edit FAQ"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(faq)}
                          title="Delete FAQ"
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
        <FaqFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleFormSave}
          onClose={() => setFormTarget(null)}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          faq={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </section>
  );
}
