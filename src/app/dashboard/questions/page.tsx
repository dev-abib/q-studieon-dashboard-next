"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  ChevronUp,
  BookOpen,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PlusCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllQuestions } from "@/features/questions/hooks/use-get-all-questions";
import { useCreateQuestion } from "@/features/questions/hooks/use-create-question";
import { useUpdateQuestion } from "@/features/questions/hooks/use-update-question";
import { useDeleteQuestion } from "@/features/questions/hooks/use-delete-question";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  slug: string;
  options: string[];
  createdAt: string;
}

interface QuestionGroup {
  slug: string;
  questions: Question[];
  createdAt: string;
}

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const questionFormSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  slug: z.string().min(1, "Slug is required"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(1, "At least one option is required"),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

// ─── Slug Palette ──────────────────────────────────────────────────────────────
const SLUG_PALETTES = [
  { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { dot: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  { dot: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  { dot: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  { dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  { dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { dot: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

function slugPalette(slug: string) {
  return SLUG_PALETTES[(slug?.charCodeAt(0) ?? 0) % SLUG_PALETTES.length];
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
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-stone-100 bg-white p-5">
      <div className="mb-3 h-4 w-2/3 rounded-lg bg-stone-100" />
      <div className="mb-2 h-3 w-1/2 rounded bg-stone-100" />
      <div className="h-3 w-full rounded bg-stone-100" />
    </div>
  );
}

// ─── Field Error ───────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[11px] text-rose-500">{message}</p>;
}

// ─── Outside-click hook ────────────────────────────────────────────────────────
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

// ─── Question Form Modal ───────────────────────────────────────────────────────
function QuestionFormModal({
  initial,
  existingSlugs,
  presetSlug,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: Question;
  existingSlugs: string[];
  presetSlug?: string | null;
  onSave: (data: QuestionFormValues) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  const [slugMode, setSlugMode] = useState<"select" | "create">(
    presetSlug && existingSlugs.includes(presetSlug)
      ? "select"
      : existingSlugs.length > 0
        ? "select"
        : "create",
  );
  const [optionList, setOptionList] = useState<string[]>(
    initial?.options ?? [""],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: initial?.text ?? "",
      slug: initial?.slug ?? (presetSlug ?? ""),
      options: initial?.options ?? [""],
    },
  });

  const selectedSlug = watch("slug");

  function handleOptionChange(index: number, value: string) {
    const next = [...optionList];
    next[index] = value;
    setOptionList(next);
    setValue("options", next, { shouldValidate: true });
  }

  function addOption() {
    const next = [...optionList, ""];
    setOptionList(next);
    setValue("options", next, { shouldValidate: false });
  }

  function removeOption(index: number) {
    if (optionList.length <= 1) return;
    const next = optionList.filter((_, i) => i !== index);
    setOptionList(next);
    setValue("options", next, { shouldValidate: true });
  }

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
                Edit{" "}
                <em className="italic text-amber-600">Question</em>
              </>
            ) : (
              <>
                New{" "}
                <em className="italic text-amber-600">Question</em>
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
      <form onSubmit={handleSubmit(onSave)} noValidate>
        <div className="space-y-5 px-6 py-5">
          {/* Slug selection / creation */}
          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
                Question Group (Slug)
              </label>

              {/* Toggle */}
              <div className="mb-3 flex gap-1 rounded-lg bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setSlugMode("select")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    slugMode === "select"
                      ? "bg-white text-stone-700 shadow-sm"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Existing slug
                </button>
                <button
                  type="button"
                  onClick={() => setSlugMode("create")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    slugMode === "create"
                      ? "bg-white text-stone-700 shadow-sm"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  New slug
                </button>
              </div>

              {slugMode === "select" ? (
                existingSlugs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {existingSlugs.map(s => {
                      const pal = slugPalette(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setValue("slug", s, { shouldValidate: true })
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            selectedSlug === s
                              ? `${pal.badge} ring-2 ring-${pal.dot.replace("bg-", "")} ring-offset-1`
                              : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                          }`}
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${pal.dot}`}
                          />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    No existing slugs. Switch to &quot;New slug&quot; to create
                    one.
                  </p>
                )
              ) : (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                    /
                  </span>
                  <Input
                    {...register("slug")}
                    placeholder="e.g. onboarding-survey"
                    className={`h-10 rounded-xl pl-6 font-mono text-sm text-stone-600 shadow-none ${
                      errors.slug
                        ? "border-rose-300 focus-visible:ring-rose-200"
                        : "border-stone-200 focus-visible:ring-amber-400"
                    }`}
                  />
                </div>
              )}
              <FieldError message={errors.slug?.message} />
            </div>
          )}

          {/* Question text */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Question Text
            </label>
            <textarea
              {...register("text")}
              placeholder="e.g. What is your preferred learning style?"
              rows={2}
              className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-stone-700 shadow-sm outline-none transition-all placeholder:text-stone-300 ${
                errors.text
                  ? "border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-2 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={errors.text?.message} />
          </div>

          {/* Options */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[10px] font-medium uppercase tracking-widest text-stone-400">
                Answer Options
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-[10px] font-medium text-amber-500 transition-colors hover:text-amber-600"
              >
                <PlusCircle className="h-3 w-3" />
                Add option
              </button>
            </div>

            <div className="space-y-2">
              {optionList.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-[10px] font-medium text-stone-400">
                    {index + 1}
                  </span>
                  <Input
                    value={opt}
                    onChange={e => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={`h-9 flex-1 rounded-lg border text-sm text-stone-700 shadow-none placeholder:text-stone-300 ${
                      errors.options?.[index]
                        ? "border-rose-300 focus-visible:ring-rose-200"
                        : "border-stone-200 focus-visible:ring-amber-400"
                    }`}
                  />
                  {optionList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options?.message && (
              <FieldError message={errors.options.message} />
            )}
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

// ─── Edit Question Modal ───────────────────────────────────────────────────────
function EditQuestionModal({
  question,
  onSave,
  onClose,
  isSaving,
}: {
  question: Question;
  onSave: (data: QuestionFormValues) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [optionList, setOptionList] = useState<string[]>(question.options);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: question.text,
      slug: question.slug,
      options: question.options,
    },
  });

  function handleOptionChange(index: number, value: string) {
    const next = [...optionList];
    next[index] = value;
    setOptionList(next);
    setValue("options", next, { shouldValidate: true });
  }

  function addOption() {
    const next = [...optionList, ""];
    setOptionList(next);
    setValue("options", next, { shouldValidate: false });
  }

  function removeOption(index: number) {
    if (optionList.length <= 1) return;
    const next = optionList.filter((_, i) => i !== index);
    setOptionList(next);
    setValue("options", next, { shouldValidate: true });
  }

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
            <Pencil className="h-4 w-4 text-sky-600" />
          </div>
          <h2
            className="text-lg font-normal text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Edit <em className="italic text-sky-600">Question</em>
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
      <form onSubmit={handleSubmit(onSave)} noValidate>
        <div className="space-y-5 px-6 py-5">
          {/* Slug (read-only on edit) */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Group
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5">
              <span className="inline-block h-2 w-2 rounded-full bg-stone-300" />
              <span className="font-mono text-sm text-stone-500">
                /{question.slug}
              </span>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Question Text
            </label>
            <textarea
              {...register("text")}
              rows={2}
              className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-stone-700 shadow-sm outline-none transition-all placeholder:text-stone-300 ${
                errors.text
                  ? "border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-2 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={errors.text?.message} />
          </div>

          {/* Options */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[10px] font-medium uppercase tracking-widest text-stone-400">
                Answer Options
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-[10px] font-medium text-amber-500 transition-colors hover:text-amber-600"
              >
                <PlusCircle className="h-3 w-3" />
                Add option
              </button>
            </div>

            <div className="space-y-2">
              {optionList.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-[10px] font-medium text-stone-400">
                    {index + 1}
                  </span>
                  <Input
                    value={opt}
                    onChange={e => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={`h-9 flex-1 rounded-lg border text-sm text-stone-700 shadow-none placeholder:text-stone-300 ${
                      errors.options?.[index]
                        ? "border-rose-300 focus-visible:ring-rose-200"
                        : "border-stone-200 focus-visible:ring-amber-400"
                    }`}
                  />
                  {optionList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options?.message && (
              <FieldError message={errors.options.message} />
            )}
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
            className="h-8 rounded-lg bg-sky-500 text-xs text-white shadow-none hover:bg-sky-600 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Pencil className="mr-1.5 h-3 w-3" />
            )}
            Save changes
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
              ? question.text.slice(0, 60) + "…"
              : question.text}
          </span>
          &rdquo; will be permanently removed from the{" "}
          <span className="font-mono text-xs text-stone-500">
            /{question.slug}
          </span>{" "}
          group. This action cannot be undone.
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

// ─── Options Preview ───────────────────────────────────────────────────────────
function OptionsPreview({ options }: { options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-md border border-stone-100 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-500"
        >
          {opt.length > 25 ? opt.slice(0, 25) + "…" : opt}
        </span>
      ))}
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({
  question,
  onEdit,
  onDelete,
}: {
  question: Question;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-xl border border-stone-100 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-stone-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-stone-800">
            {question.text}
          </p>
          <div className="mt-2">
            <OptionsPreview options={question.options} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edit question"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 opacity-0 transition-all hover:bg-sky-50 hover:text-sky-500 group-hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete question"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slug Group Section ────────────────────────────────────────────────────────
function SlugGroup({
  group,
  pal,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: {
  group: QuestionGroup;
  pal: (typeof SLUG_PALETTES)[number];
  onAddQuestion: (slug: string) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (q: Question) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm transition-all hover:border-stone-200">
      {/* Group Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-stone-50/50"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${pal.bg}`}
          >
            <Layers className={`h-4 w-4 ${pal.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${pal.dot}`} />
              <span className="font-mono text-sm font-medium text-stone-700">
                /{group.slug}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-stone-400">
              {group.questions.length}{" "}
              {group.questions.length === 1 ? "question" : "questions"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onAddQuestion(group.slug)}
            title="Add question to this group"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-amber-50 hover:text-amber-500"
          >
            <Plus className="h-4 w-4" />
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-stone-300" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-300" />
          )}
        </div>
      </button>

      {/* Questions List */}
      {expanded && (
        <div className="space-y-2 border-t border-stone-50 px-5 py-4">
          {group.questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              onEdit={() => onEditQuestion(q)}
              onDelete={() => onDeleteQuestion(q)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sort Button ───────────────────────────────────────────────────────────────
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

// ─── Per-page select ───────────────────────────────────────────────────────────
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

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-20">
      <HelpCircle className="mb-3 h-8 w-8 text-stone-200" />
      <p className="text-sm text-stone-400">No questions found</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-3 text-xs text-amber-500 hover:underline"
      >
        Create your first question →
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function QuestionsPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(12);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"text" | "slug" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPresetSlug, setCreatePresetSlug] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const { data, isLoading } = useGetAllQuestions({
    page: pg,
    limit,
    search,
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const { mutate: createQuestion, isPending: isCreating } =
    useCreateQuestion();
  const { mutate: updateQuestion, isPending: isUpdating } =
    useUpdateQuestion();
  const { mutate: deleteQuestion, isPending: isDeleting } =
    useDeleteQuestion();

  const allQuestions: Question[] = data?.data?.questions ?? [];
  const meta = data?.data?.meta;

  // Group questions by slug
  const grouped = useMemo(() => {
    const groups: Record<string, QuestionGroup> = {};
    for (const q of allQuestions) {
      if (!groups[q.slug]) {
        groups[q.slug] = {
          slug: q.slug,
          questions: [],
          createdAt: q.createdAt,
        };
      }
      groups[q.slug].questions.push(q);
    }
    return Object.values(groups).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [allQuestions]);

  const existingSlugs = useMemo(
    () => [...new Set(allQuestions.map(q => q.slug))],
    [allQuestions],
  );

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

  function handleCreateSave(data: QuestionFormValues) {
    createQuestion(data, {
      onSuccess: () => {
        setShowCreateModal(false);
        setCreatePresetSlug(null);
      },
    });
  }

  function handleEditSave(data: QuestionFormValues) {
    if (!editTarget) return;
    updateQuestion(
      { id: editTarget.id, payload: data },
      { onSuccess: () => setEditTarget(null) },
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteQuestion(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  // Compute total groups count
  const totalGroups = grouped.length;

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
                Survey Builder
              </p>
              <h1
                className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                All <em className="italic text-amber-600">Questions</em>
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <Input
                  value={search}
                  placeholder="Search questions…"
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
                onClick={() => {
                  setCreatePresetSlug(null);
                  setShowCreateModal(true);
                }}
                className="h-10 rounded-xl bg-amber-500 px-4 text-sm text-white shadow-none hover:bg-amber-600"
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Question
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={HelpCircle}
              label="Total Questions"
              value={meta?.total?.toLocaleString() ?? "—"}
              sub="questions"
              accent="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={Layers}
              label="Question Groups"
              value={totalGroups.toLocaleString() ?? "—"}
              sub="slugs"
              accent="bg-sky-50 text-sky-600"
            />
            <StatCard
              icon={MessageSquare}
              label="Avg Options/Question"
              value={
                allQuestions.length > 0
                  ? (
                      allQuestions.reduce(
                        (acc, q) => acc + (q.options?.length ?? 0),
                        0,
                      ) / allQuestions.length
                    ).toFixed(1)
                  : "—"
              }
              sub="per q"
              accent="bg-teal-50 text-teal-600"
            />
            <StatCard
              icon={BookOpen}
              label="Current Page"
              value={meta ? `${meta.page}` : "—"}
              sub={meta ? `of ${meta.totalPages}` : undefined}
              accent="bg-violet-50 text-violet-600"
            />
          </div>
        </div>

        {/* ── Sort & Per-page Controls ── */}
        <div className="flex items-center justify-between px-6 pb-3">
          <div className="flex items-center gap-3">
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
              label="Slug"
              active={sortField === "slug"}
              dir={sortField === "slug" ? sortDir : null}
              onClick={() => handleSort("slug")}
            />
          </div>
          <PerPageSelect value={limit} onChange={handleLimitChange} />
        </div>

        {/* ── Grouped Content ── */}
        <div className="px-6 pb-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : grouped.length > 0 ? (
            <div className="space-y-4">
              {grouped.map(g => {
                const pal = slugPalette(g.slug);
                return (
                  <SlugGroup
                    key={g.slug}
                    group={g}
                    pal={pal}
                    onAddQuestion={slug => {
                      setCreatePresetSlug(slug);
                      setShowCreateModal(true);
                    }}
                    onEditQuestion={q => setEditTarget(q)}
                    onDeleteQuestion={q => setDeleteTarget(q)}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              onCreate={() => {
                setCreatePresetSlug(null);
                setShowCreateModal(true);
              }}
            />
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-xs font-light text-stone-400">
              Page{" "}
              <span className="font-medium text-stone-600">{meta.page}</span> of{" "}
              <span className="font-medium text-stone-600">
                {meta.totalPages}
              </span>
              &nbsp;·&nbsp;
              <span className="font-medium text-stone-600">
                {meta.total}
              </span>{" "}
              total
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => setPg(p => p - 1)}
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                type="button"
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
      {showCreateModal && (
        <QuestionFormModal
          existingSlugs={existingSlugs}
          presetSlug={createPresetSlug}
          onSave={handleCreateSave}
          onClose={() => {
            setShowCreateModal(false);
            setCreatePresetSlug(null);
          }}
          isSaving={isCreating}
        />
      )}

      {editTarget && (
        <EditQuestionModal
          question={editTarget}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
          isSaving={isUpdating}
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
