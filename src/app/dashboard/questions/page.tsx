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
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
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

type SortDir = "asc" | "desc" | null;
type SortField = "text" | "createdAt";
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

// ─── Question Form Modal (Create / Edit) ───────────────────────────────────────
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
    options: string[];
    categoryId: string;
  }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [text, setText] = useState(initial?.text ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? (categories[0]?.id ?? "")
  );
  const [options, setOptions] = useState<string[]>(
    initial?.options ?? ["yes", "no", "not_sure"]
  );

  const [textError, setTextError] = useState("");
  const [catError, setCatError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  const handleAddOption = () => {
    setOptions(prev => [...prev, ""]);
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) return;
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!text.trim()) {
      setTextError("Question text is required");
      valid = false;
    } else setTextError("");

    if (!categoryId) {
      setCatError("Please select a category");
      valid = false;
    } else setCatError("");

    const cleanedOptions = options.map(o => o.trim()).filter(Boolean);
    if (cleanedOptions.length < 2) {
      setOptionsError("At least 2 non-empty options are required");
      valid = false;
    } else setOptionsError("");

    if (!valid) return;

    onSave({
      text: text.trim(),
      options: cleanedOptions,
      categoryId,
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
              {isEdit ? "Edit Onsite Question" : "Create Onsite Question"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit ? "Modifying existing question" : "Add assessment question to directory"}
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
        {/* Category Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Assigned Category <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={e => {
                setCategoryId(e.target.value);
                if (catError) setCatError("");
              }}
              className="h-10.5 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 px-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            >
              <option value="" disabled>Select category…</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {catError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {catError}
            </p>
          )}
        </div>

        {/* Question Text */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Question Prompt Text <span className="text-primary">*</span>
          </label>
          <Input
            value={text}
            onChange={e => {
              setText(e.target.value);
              if (textError) setTextError("");
            }}
            placeholder="e.g. What is the structural condition of the foundation?"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
          {textError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {textError}
            </p>
          )}
        </div>

        {/* Options Builder */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Selectable Response Options <span className="text-primary">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddOption}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add Option
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 shrink-0">
                  {idx + 1}
                </span>
                <Input
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="h-9 rounded-xl border-slate-200 dark:border-slate-700 text-xs dark:bg-slate-800/40"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {optionsError && (
            <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {optionsError}
            </p>
          )}
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
                Saving Question...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {isEdit ? "Save Changes" : "Create Question"}
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
      <div className="p-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
          <Trash2 className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Delete Onsite Question?
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">&ldquo;{question.text}&rdquo;</span>? This action cannot be undone.
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Question"}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Main Onsite Questions Component ───────────────────────────────────────────
export default function QuestionsPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [formTarget, setFormTarget] = useState<Question | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const { data: catRes } = useGetAllCategories({ limit: 100 });
  const allCategories: Category[] = catRes?.data?.categories ?? [];

  const { data, isLoading } = useGetAllQuestions({
    page: pg,
    limit,
    search,
    categoryId: categoryFilter || undefined,
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion();
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion();

  const questions: Question[] = data?.data?.questions ?? [];
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

  function handleFormSave(formData: {
    text: string;
    options: string[];
    categoryId: string;
  }) {
    const payload = {
      text: formData.text,
      options: formData.options as ("yes" | "no" | "not_sure")[],
      categoryId: formData.categoryId,
    };
    if (formTarget === "new") {
      createQuestion(payload, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updateQuestion(
        { id: formTarget.id, payload },
        { onSuccess: () => setFormTarget(null) }
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
    allCategories.find(c => c.id === id)?.name ?? "Uncategorized";

  return (
    <section className="w-full flex flex-col gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Survey & Assessment Builder"
        title="Onsite Questions Directory"
        icon={HelpCircle}
        description="Manage onsite assessment questions, options list, and category mappings"
      >
        <Button
          type="button"
          onClick={() => setFormTarget("new")}
          className="h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </PageHeader>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={HelpCircle}
          label="Total Questions"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="questions"
          accent="bg-primary/10 text-primary border-primary/20"
        />
        <StatCard
          icon={BookMarked}
          label="Categories Count"
          value={allCategories.length.toLocaleString() ?? "—"}
          sub="active"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        />
        <StatCard
          icon={MessageSquare}
          label="Avg Options per Q"
          value={
            questions.length > 0
              ? (
                  questions.reduce((acc, q) => acc + (q.options?.length ?? 0), 0) /
                  questions.length
                ).toFixed(1)
              : "—"
          }
          sub="options"
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
        />
      </div>

      {/* ── Table Card Container ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              All Questions
            </h2>
            {meta && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {meta.total?.toLocaleString()} Total
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Select */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setPg(1);
                }}
                className="h-10 appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 pl-3 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Categories</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                placeholder="Search question text…"
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
                    label="Question Prompt"
                    active={sortField === "text"}
                    dir={sortField === "text" ? sortDir : null}
                    onClick={() => handleSort("text")}
                  />
                </th>
                <th className="px-6 py-3.5">Assigned Category</th>
                <th className="px-6 py-3.5">Response Options</th>
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
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No questions found.
                  </td>
                </tr>
              ) : (
                questions.map(q => {
                  const catName = q.category?.name ?? getCategoryName(q.categoryId);
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Question Text */}
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-md">
                        {q.text}
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          <BookMarked className="h-3 w-3 text-primary" />
                          {catName}
                        </span>
                      </td>

                      {/* Options List Pills */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {q.options?.map((opt, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormTarget(q)}
                            title="Edit Question"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(q)}
                            title="Delete Question"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
    </section>
  );
}
