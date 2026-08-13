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
  MessageSquare,
  BookMarked,
  Check,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllQuestions } from "@/features/questions/hooks/use-get-all-questions";
import { useCreateQuestion } from "@/features/questions/hooks/use-create-question";
import { useUpdateQuestion } from "@/features/questions/hooks/use-update-question";
import { useDeleteQuestion } from "@/features/questions/hooks/use-delete-question";
import { useGetAllCategories } from "@/features/categories/hooks/use-get-all-categories";
import type { Category } from "@/features/categories/types/category.types";
import Image from "next/image";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  options: string[];
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

// ─── Category palette ──────────────────────────────────────────────────────────
const CAT_PALETTES = [
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "bg-amber-500" },
  { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", dot: "bg-sky-500" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", dot: "bg-rose-500" },
  { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", dot: "bg-teal-500" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", dot: "bg-violet-500" },
  { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", dot: "bg-orange-500" },
  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", dot: "bg-indigo-500" },
];

function catPalette(id: string) {
  return CAT_PALETTES[(id?.charCodeAt(0) ?? 0) % CAT_PALETTES.length];
}

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

// ─── Skeleton ──────────────────────────────────────────────────────────────────
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
const PER_PAGE_OPTIONS = [6, 12, 24, 48];

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
          wide ? "max-w-xl" : "max-w-sm"
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

// ─── Category Dropdown ─────────────────────────────────────────────────────────
function CategorySelect({
  value,
  onChange,
  categories,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: Category[];
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(dropdownRef as React.RefObject<HTMLElement>, () =>
    setOpen(false),
  );

  const selected = categories.find(c => c.id === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full items-center gap-2.5 rounded-xl border bg-white px-4 text-sm shadow-sm transition-all ${
          error
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-stone-200 hover:border-stone-300 focus-visible:ring-2 focus-visible:ring-amber-400"
        }`}
      >
        {selected ? (
          <>
            {selected.icon ? (
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded border border-stone-200">
                <Image
                  src={selected.icon}
                  alt=""
                  className="h-full w-full object-cover"
                  width={20}
                  height={20}
                />
              </div>
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-50">
                <BookMarked className="h-3 w-3 text-amber-500" />
              </div>
            )}
            <span className="flex-1 text-left text-sm text-stone-700">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-sm text-stone-400">
            Select a category...
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-stone-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {categories.length === 0 ? (
            <p className="px-3 py-2 text-xs text-stone-400">
              No categories available
            </p>
          ) : (
            categories.map(cat => {
              const pal = catPalette(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50 ${
                    value === cat.id ? "bg-amber-50/50" : ""
                  }`}
                >
                  {cat.icon ? (
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-stone-100">
                      <Image
                        src={cat.icon}
                        alt=""
                        className="h-full w-full object-cover"
                        width={24}
                        height={24}
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${pal.bg}`}
                    >
                      <BookMarked className={`h-3 w-3 ${pal.text}`} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-700">
                      {cat.name}
                    </p>
                    <p className="font-mono text-[10px] text-stone-400">
                      /{cat.slug}
                    </p>
                  </div>
                  {value === cat.id && (
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}

// ─── Fixed Options ─────────────────────────────────────────────────────────────
const FIXED_OPTIONS = [
  { value: "yes", label: "Yes", icon: Check, color: "emerald" as const },
  { value: "no", label: "No", icon: X, color: "rose" as const },
  { value: "not_sure", label: "Not Sure", icon: HelpCircle, color: "amber" as const },
] as const;

const OPTION_STYLES: Record<string, { bg: string; border: string; text: string; icon: string; ring: string; dot: string; label: string }> = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500", ring: "ring-emerald-300", dot: "bg-emerald-400", label: "Yes" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500", ring: "ring-rose-300", dot: "bg-rose-400", label: "No" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500", ring: "ring-amber-300", dot: "bg-amber-400", label: "Not Sure" },
};

const OPTION_LOOKUP: Record<string, string> = {
  yes: "emerald",
  no: "rose",
  not_sure: "amber",
};

// ─── Options Preview ───────────────────────────────────────────────────────────
function OptionsPreview({ options }: { options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, i) => {
        const colorKey = OPTION_LOOKUP[opt];
        const style = colorKey ? OPTION_STYLES[colorKey] : null;
        if (!style) {
          return (
            <span
              key={i}
              className="inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-500"
            >
              {opt}
            </span>
          );
        }
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-md border ${style.border} ${style.bg} px-2 py-0.5 text-[10px] font-medium ${style.text}`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Question Form Modal ───────────────────────────────────────────────────────
function QuestionFormModal({
  initial,
  categories,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: Question;
  categories: Category[];
  onSave: (data: {
    text: string;
    options: ("yes" | "no" | "not_sure")[];
    categoryId: string;
  }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [text, setText] = useState(initial?.text ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [options] = useState<string[]>(
    (initial?.options as ("yes" | "no" | "not_sure")[]) ?? ["yes", "no", "not_sure"],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});



  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!text.trim()) errs.text = "Question text is required";
    if (!categoryId) errs.categoryId = "Category is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      text: text.trim(),
      options: ["yes", "no", "not_sure"] as const,
      categoryId,
    });
  };

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <HelpCircle className="h-4 w-4 text-amber-600" />
          </div>
          <h2
            className="text-lg font-normal text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {isEdit ? (
              <>
                Edit <em className="italic text-amber-600">Question</em>
              </>
            ) : (
              <>
                New <em className="italic text-amber-600">Question</em>
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

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-5 px-6 py-5">
          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Category
            </label>
            <CategorySelect
              value={categoryId}
              onChange={v => {
                setCategoryId(v);
                if (errors.categoryId) {
                  setErrors(prev => ({ ...prev, categoryId: "" }));
                }
              }}
              categories={categories}
              error={errors.categoryId}
            />
          </div>

          {/* Question text */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Question Text
            </label>
            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value);
                if (errors.text) setErrors(prev => ({ ...prev, text: "" }));
              }}
              placeholder="e.g. What is your preferred learning style?"
              rows={2}
              className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-stone-700 shadow-sm outline-none transition-all placeholder:text-stone-300 ${
                errors.text
                  ? "border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-2 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={errors.text} />
          </div>

          {/* Options - Fixed to yes / no / not_sure */}
          <div>
            <label className="mb-3 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Answer Options
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FIXED_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const c = OPTION_STYLES[opt.color];
                return (
                  <div
                    key={opt.value}
                    className={`flex items-center gap-2.5 rounded-xl border ${c.border} ${c.bg} px-3.5 py-3 ring-1 ${c.ring}`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.bg}`}>
                      <Icon className={`h-4 w-4 ${c.icon}`} />
                    </div>
                    <span className={`text-sm font-medium ${c.text}`}>
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
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
            {isEdit ? "Save changes" : "Create question"}
          </Button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({
  question,
  onConfirm,
  onCancel,
  isLoading,
}: {
  question: Question;
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
          Delete question?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
          &ldquo;
          <span className="text-stone-600">
            {question.text.length > 60
              ? question.text.slice(0, 60) + "\u2026"
              : question.text}
          </span>
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
            className="h-8 rounded-lg bg-rose-500 text-xs text-white shadow-none hover:bg-rose-600 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3 w-3" />
            )}
            Delete question
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function QuestionsPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(6);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<"text" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [formTarget, setFormTarget] = useState<Question | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const { data, isLoading } = useGetAllQuestions({
    page: pg,
    limit,
    search,
    categoryId: categoryFilter || undefined,
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const { data: catData } = useGetAllCategories({ limit: 100 });
  const allCategories: Category[] = catData?.data?.categories ?? [];

  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion();
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion();

  const questions: Question[] = data?.data?.questions ?? [];
  const meta: QuestionMeta | undefined = data?.data?.meta;

  function handleSort(field: typeof sortField) {
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

  function handleFormSave(formData: {
    text: string;
    options: ("yes" | "no" | "not_sure")[];
    categoryId: string;
  }) {
    if (formTarget === "new") {
      createQuestion(formData, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updateQuestion(
        { id: formTarget.id, payload: formData },
        { onSuccess: () => setFormTarget(null) },
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteQuestion(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const getCategoryName = (id: string) =>
    allCategories.find(c => c.id === id)?.name ?? "Unknown";

  const getCategoryIcon = (id: string) =>
    allCategories.find(c => c.id === id)?.icon ?? null;

  return (
    <>
      <div className="flex flex-col gap-6 min-h-screen">
        {/* ── Top Header Banner ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Survey & Assessment Builder
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Onsite Questions Directory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                placeholder="Search questions…"
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
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={HelpCircle}
              label="Total Questions"
              value={meta?.total?.toLocaleString() ?? "\u2014"}
              sub="questions"
              accent="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={BookMarked}
              label="Categories"
              value={allCategories.length.toLocaleString() ?? "\u2014"}
              sub="categories"
              accent="bg-sky-50 text-sky-600"
            />
            <StatCard
              icon={MessageSquare}
              label="Avg Options"
              value={
                questions.length > 0
                  ? (
                      questions.reduce(
                        (acc, q) => acc + (q.options?.length ?? 0),
                        0,
                      ) / questions.length
                    ).toFixed(1)
                  : "\u2014"
              }
              sub="per q"
              accent="bg-teal-50 text-teal-600"
            />
            <StatCard
              icon={Layers}
              label="Current Page"
              value={meta ? `${meta.page}` : "\u2014"}
              sub={meta ? `of ${meta.totalPages}` : undefined}
              accent="bg-violet-50 text-violet-600"
            />
          </div>

        {/* ── Filters & Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                Sort
              </span>
              <SortButton
                label="Created"
                active={sortField === "createdAt"}
                dir={sortField === "createdAt" ? sortDir : null}
                onClick={() => handleSort("createdAt")}
              />
              <SortButton
                label="Text"
                active={sortField === "text"}
                dir={sortField === "text" ? sortDir : null}
                onClick={() => handleSort("text")}
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setPg(1);
                }}
                className="h-8 appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-7 text-xs text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-300"
              >
                <option value="">All categories</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
            </div>
          </div>

          <PerPageSelect value={limit} onChange={handleLimitChange} />
        </div>

        {/* ── Table ── */}
        <div className="mx-6 mb-5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-none items-center justify-between border-b border-stone-100 px-6 py-3">
            <h2
              className="text-base font-normal text-stone-700"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              All Questions
            </h2>
            <div className="flex items-center gap-4">
              {meta && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">
                  {meta.total?.toLocaleString()} total
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[750px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-stone-100 bg-stone-50/95 backdrop-blur-sm">
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                      Question
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                      Category
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                      Options
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
                      Created
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
                ) : questions.length > 0 ? (
                  questions.map(q => {
                    const pal = catPalette(q.categoryId);
                    const catName = q.category?.name ?? getCategoryName(q.categoryId);
                    const catIcon = q.category?.icon ?? getCategoryIcon(q.categoryId);
                    return (
                      <tr
                        key={q.id}
                        className="group border-b border-stone-100 transition-colors last:border-none hover:bg-stone-50/70"
                      >
                        <td className="max-w-xs px-6 py-3.5">
                          <p className="truncate text-sm text-stone-800">
                            {q.text}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            {catIcon ? (
                              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-stone-200">
                                <Image
                                  src={catIcon}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  width={24}
                                  height={24}
                                />
                              </div>
                            ) : (
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${pal.bg}`}
                              >
                                <BookMarked className={`h-3 w-3 ${pal.text}`} />
                              </div>
                            )}
                            <span className="text-xs text-stone-500">
                              {catName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 px-2.5 py-1 text-xs text-stone-500">
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${pal.dot}`}
                            />
                            {q.options?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs tabular-nums text-stone-400">
                            {new Date(q.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setFormTarget(q)}
                              title="Edit question"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(q)}
                              title="Delete question"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
                      <div className="flex flex-col items-center">
                        <HelpCircle className="mb-2 h-6 w-6 text-stone-200" />
                        {search || categoryFilter
                          ? "No questions match your filters"
                          : "No questions found"}
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
              &nbsp;\u00b7&nbsp;
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
        <QuestionFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          categories={allCategories}
          onSave={handleFormSave}
          onClose={() => setFormTarget(null)}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          question={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
