"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  FileText,
  Globe,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  ExternalLink,
  Undo,
  Redo,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Palette,
  Copy,
  Layers,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllPages } from "@/features/dynamic-page/hooks/use-get-all-dynamic-pages";
import { useCreatePage } from "@/features/dynamic-page/hooks/use-create-page";
import { useUpdatePage } from "@/features/dynamic-page/hooks/use-update-page";
import { useDeletePage } from "@/features/dynamic-page/hooks/use-delete-page";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DynamicPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  createdAt?: string;
}

type PageFilter = "all" | "published" | "draft";
type SortDir = "asc" | "desc" | null;
type SortField = "title" | "createdAt";

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers and hyphens allowed",
    ),
  description: z
    .string()
    .min(1, "Content is required")
    .refine(
      val => val.replace(/<[^>]+>/g, "").trim().length > 0,
      "Content cannot be empty",
    ),
  isPublished: z.boolean().optional(),
});

type PageFormValues = z.infer<typeof pageSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────────
// Strip one outer <div> wrapper — the editor always emits <div>…content…</div>
// and we remove it when reloading into the contentEditable to avoid nesting.
function unwrapDiv(html: string): string {
  const trimmed = html.trim();
  const match = trimmed.match(/^<div>([\s\S]*)<\/div>$/i);
  return match ? match[1] : trimmed;
}

// Ensure saved HTML is wrapped in exactly one <div>.
function wrapInDiv(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "<div></div>";
  const match = trimmed.match(/^<div>([\s\S]*)<\/div>$/i);
  if (match) return trimmed;
  return `<div>${trimmed}</div>`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

// ─── Rich text editor primitives ──────────────────────────────────────────────
function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => {
        // Keep the editor focused/selected while using the toolbar
        e.preventDefault();
        onClick();
      }}
      title={title}
      className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="mx-0.5 h-5 w-px bg-stone-200 dark:bg-slate-700" />
  );
}

const SELECT_CLASS =
  "h-7 cursor-pointer rounded border border-stone-200 bg-white px-1.5 text-[11px] text-stone-600 outline-none hover:border-stone-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500";

// ─── HTML Rich Text Editor ─────────────────────────────────────────────────────
function HtmlEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  // Prevents the sync effect from overwriting innerHTML while the user types
  // (which would reset the cursor position).
  const isEmitting = useRef(false);

  // Sync external value → editor DOM (only on external changes, e.g. reset/edit).
  useEffect(() => {
    if (!editorRef.current) return;
    if (isEmitting.current) {
      isEmitting.current = false;
      return;
    }
    const inner = unwrapDiv(value);
    if (editorRef.current.innerHTML !== inner) {
      editorRef.current.innerHTML = inner;
    }
  }, [value]);

  const emit = useCallback(() => {
    if (!editorRef.current) return;
    isEmitting.current = true;
    onChange(wrapInDiv(editorRef.current.innerHTML));
  }, [onChange]);

  const exec = useCallback(
    (cmd: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(cmd, false, val ?? undefined);
      emit();
    },
    [emit],
  );

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:", "https://");
    if (url) exec("insertImage", url);
  };

  const insertTable = () => {
    const rowStr = prompt("Rows:", "3");
    const colStr = prompt("Columns:", "3");
    const rows = parseInt(rowStr ?? "3", 10);
    const cols = parseInt(colStr ?? "3", 10);
    if (!rows || !cols || isNaN(rows) || isNaN(cols)) return;
    const html =
      `<table style="border-collapse:collapse;width:100%">` +
      Array.from({ length: rows })
        .map(
          () =>
            `<tr>${Array.from({ length: cols })
              .map(
                () =>
                  `<td style="border:1px solid #d1d5db;padding:6px 10px;min-width:80px">&nbsp;</td>`,
              )
              .join("")}</tr>`,
        )
        .join("") +
      `</table><br>`;
    exec("insertHTML", html);
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all dark:bg-slate-900 ${
        error
          ? "border-rose-300 ring-2 ring-rose-100 dark:border-rose-500/50 dark:ring-rose-500/10"
          : "border-stone-200 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100 dark:border-slate-700 dark:focus-within:border-amber-500/50 dark:focus-within:ring-amber-500/10"
      }`}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 bg-stone-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
        <ToolBtn onClick={() => exec("undo")} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
        <Divider />

        {/* Block format */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => {
            exec("formatBlock", e.target.value);
            e.target.value = "p";
          }}
          defaultValue="p"
          className={SELECT_CLASS}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="pre">Code Block</option>
          <option value="blockquote">Blockquote</option>
        </select>

        {/* Font size */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => exec("fontSize", e.target.value)}
          defaultValue="3"
          className={SELECT_CLASS}
        >
          <option value="1">XS</option>
          <option value="2">SM</option>
          <option value="3">MD</option>
          <option value="4">LG</option>
          <option value="5">XL</option>
          <option value="6">2XL</option>
        </select>

        <Divider />

        {/* Inline styles */}
        <ToolBtn onClick={() => exec("bold")} title="Bold">
          <span className="text-[13px] font-bold">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic">
          <span className="text-[13px] italic">I</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline">
          <span className="text-[13px] underline">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough">
          <span className="text-[13px] line-through">S</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("superscript")} title="Superscript">
          <span className="text-[11px]">x²</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("subscript")} title="Subscript">
          <span className="text-[11px]">x₂</span>
        </ToolBtn>

        <Divider />

        {/* Text color */}
        <div className="relative flex items-center">
          <ToolBtn onClick={() => colorRef.current?.click()} title="Text Color">
            <Palette className="h-3.5 w-3.5" />
          </ToolBtn>
          <input
            ref={colorRef}
            type="color"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            onChange={e => exec("foreColor", e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>

        {/* Highlight */}
        <ToolBtn
          onClick={() => {
            const c = prompt("Highlight color (hex):", "#fef08a");
            if (c) exec("hiliteColor", c);
          }}
          title="Highlight"
        >
          <span
            className="rounded-[2px] px-[3px] text-[11px] font-medium"
            style={{ background: "#fef08a" }}
          >
            A
          </span>
        </ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn onClick={() => exec("justifyLeft")} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("justifyFull")} title="Justify">
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolBtn>

        <Divider />

        {/* Lists & indentation */}
        <ToolBtn
          onClick={() => exec("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => exec("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("indent")} title="Indent">
          <span className="font-mono text-[11px]">→</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("outdent")} title="Outdent">
          <span className="font-mono text-[11px]">←</span>
        </ToolBtn>

        <Divider />

        {/* Insert elements */}
        <ToolBtn onClick={insertLink} title="Insert Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("unlink")} title="Remove Link">
          <span className="text-[11px] line-through">url</span>
        </ToolBtn>
        <ToolBtn onClick={insertImage} title="Insert Image">
          <span className="text-[11px]">IMG</span>
        </ToolBtn>
        <ToolBtn onClick={insertTable} title="Insert Table">
          <span className="text-[11px]">TBL</span>
        </ToolBtn>
        <ToolBtn
          onClick={() => exec("insertHorizontalRule")}
          title="Horizontal Rule"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>

        <Divider />

        {/* Utilities */}
        <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting">
          <span className="text-[10px] uppercase tracking-wide">Clear</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("selectAll")} title="Select All">
          <span className="text-[10px] uppercase tracking-wide">All</span>
        </ToolBtn>
      </div>

      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyDown={e => {
          if (e.key === "Tab") {
            e.preventDefault();
            exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();

            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            const br = document.createElement("br");
            range.insertNode(br);

            const next = br.nextSibling;
            const atEnd =
              !next ||
              (next.nodeType === Node.TEXT_NODE &&
                (next.textContent === "" || next.textContent === "\n"));

            if (atEnd) {
              const trailingBr = document.createElement("br");
              br.after(trailingBr);
              range.setStartBefore(trailingBr);
            } else {
              range.setStartAfter(br);
            }

            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            emit();
          }
        }}
        onKeyUp={e => {
          // Catch Shift+Enter's native <br> and sync it to form state
          if (e.key === "Enter" && e.shiftKey) {
            emit();
          }
        }}
        className="rich-content min-h-52 max-w-none px-5 py-4 outline-none"
      />
    </div>
  );
}

// ─── Field Error ───────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[11px] text-rose-500 dark:text-rose-400">
      {message}
    </p>
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm dark:bg-slate-950/70">
      <div
        ref={panelRef}
        className={`relative my-auto w-full rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${
          wide ? "max-w-2xl" : "max-w-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Page Form Modal (create / edit) ───────────────────────────────────────────
function PageFormModal({
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: DynamicPage;
  onSave: (data: PageFormValues) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!initial;
  // Stop auto-generating the slug once the user manually edits the slug field.
  const slugEdited = useRef(isEdit);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      isPublished: initial?.isPublished ?? false,
    },
  });

  const titleValue = watch("title");
  useEffect(() => {
    if (!slugEdited.current) {
      const generated = titleValue
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generated, { shouldValidate: true });
    }
  }, [titleValue, setValue]);

  const isPublished = watch("isPublished");
  const labelClass =
    "mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400 dark:text-slate-400";
  const inputClass = (hasError: boolean) =>
    `h-10 rounded-xl text-sm text-stone-700 shadow-none dark:bg-slate-800 dark:text-slate-200 ${
      hasError
        ? "border-rose-300 focus-visible:ring-rose-200 dark:border-rose-500/50"
        : "border-stone-200 focus-visible:ring-amber-400 dark:border-slate-700 dark:focus-visible:ring-amber-500"
    }`;

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h2
            className="text-lg font-normal text-stone-800 dark:text-slate-100"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {isEdit ? (
              <>
                Edit <em className="italic text-amber-600 dark:text-amber-400">{initial?.title}</em>
              </>
            ) : (
              <>
                New <em className="italic text-amber-600 dark:text-amber-400">Dynamic Page</em>
              </>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSave)} noValidate>
        <div className="space-y-5 px-6 py-5">
          {/* Title */}
          <div>
            <label className={labelClass}>Page Title</label>
            <Input
              {...register("title")}
              placeholder="e.g. Privacy Policy"
              className={inputClass(!!errors.title)}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Slug */}
          <div>
            <label className={labelClass}>URL Slug</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 dark:text-slate-500">
                /
              </span>
              <Input
                {...register("slug", {
                  onChange: () => {
                    slugEdited.current = true;
                  },
                })}
                placeholder="privacy-policy"
                className={`${inputClass(!!errors.slug)} pl-6 font-mono text-stone-600 dark:text-slate-300`}
              />
            </div>
            <FieldError message={errors.slug?.message} />
          </div>

          {/* Content (rich HTML) */}
          <div>
            <label className={labelClass}>
              Content{" "}
              <span className="normal-case tracking-normal text-stone-300 dark:text-slate-500">
                (rich HTML)
              </span>
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <HtmlEditor
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.description?.message}
                />
              )}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isPublished
                    ? "bg-teal-50 dark:bg-teal-500/10"
                    : "bg-stone-100 dark:bg-slate-700"
                }`}
              >
                <Globe
                  className={`h-3.5 w-3.5 ${
                    isPublished
                      ? "text-teal-500 dark:text-teal-400"
                      : "text-stone-400 dark:text-slate-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-700 dark:text-slate-200">
                  {isPublished ? "Published" : "Draft"}
                </p>
                <p className="text-[10px] text-stone-400 dark:text-slate-500">
                  {isPublished
                    ? "This page is visible to everyone"
                    : "Only admins can see this page"}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() =>
                setValue("isPublished", !isPublished, { shouldDirty: true })
              }
              className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                isPublished ? "bg-teal-500" : "bg-stone-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isPublished ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
              <Save className="mr-1.5 h-3 w-3" />
            )}
            {isEdit ? "Save changes" : "Create page"}
          </Button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({
  page,
  onConfirm,
  onCancel,
  isLoading,
}: {
  page: DynamicPage;
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
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
          <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400" />
        </div>
        <h3
          className="mt-4 text-lg font-normal text-stone-800 dark:text-slate-100"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Delete <em className="italic text-rose-500">{page.title}</em>?
        </h3>
        <p className="mt-1.5 text-sm text-stone-400 dark:text-slate-400">
          The page at{" "}
          <span className="font-mono text-xs text-stone-500 dark:text-slate-300">
            /{page.slug}
          </span>{" "}
          will be permanently removed. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
            Delete page
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({
  page,
  onClose,
}: {
  page: DynamicPage;
  onClose: () => void;
}) {
  // The modal only renders after a client-side click, so `window` is safe here.
  const publicUrl = `${window.location.origin}/page/${page.slug}`;

  return (
    <ModalBackdrop onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-500/10">
            <Eye className="h-4 w-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div>
            <h2
              className="text-lg font-normal text-stone-800 dark:text-slate-100"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {page.title}
            </h2>
            <p className="font-mono text-[10px] text-stone-400 dark:text-slate-500">
              /{page.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {page.isPublished && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
            >
              <ExternalLink className="h-3 w-3" />
              Open public
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Content authored by admins via the rich editor, not end-users.
          dangerouslySetInnerHTML is acceptable here. */}
      <div
        className="rich-content max-h-[60vh] overflow-y-auto px-6 py-5"
        dangerouslySetInnerHTML={{ __html: page.description }}
      />
    </ModalBackdrop>
  );
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
    <div className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className="mt-0.5 text-2xl font-normal leading-none text-stone-800 dark:text-slate-100"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {value}
          {sub && (
            <span
              className="ml-1.5 text-xs font-normal text-amber-600 dark:text-amber-400"
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

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
        published
          ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
          : "bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          published ? "bg-teal-500" : "bg-stone-400 dark:bg-slate-500"
        }`}
      />
      {published ? "Published" : "Draft"}
    </span>
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
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
        active
          ? "text-amber-600 dark:text-amber-400"
          : "text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300"
      }`}
    >
      {label}
      <Icon
        className={`h-3 w-3 ${
          active ? "text-amber-500 dark:text-amber-400" : "text-stone-300 dark:text-slate-600"
        }`}
      />
    </button>
  );
}

// ─── Per-page select ───────────────────────────────────────────────────────────
const PER_PAGE_OPTIONS = [5, 10, 15, 20];

function PerPageSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs text-stone-400 dark:text-slate-500">Rows</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-8 appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-7 text-xs text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {PER_PAGE_OPTIONS.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
      </div>
    </div>
  );
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100 dark:border-slate-800">
      <td colSpan={4} className="px-6 py-4">
        <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100 dark:bg-slate-800" />
      </td>
    </tr>
  );
}

// ─── Filter Tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS: { key: PageFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DynamicPagesPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PageFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [formTarget, setFormTarget] = useState<DynamicPage | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DynamicPage | null>(null);
  const [previewTarget, setPreviewTarget] = useState<DynamicPage | null>(null);

  const { data, isLoading } = useGetAllPages({
    page: pg,
    limit,
    search,
    published: filter === "all" ? undefined : filter === "published",
    sortBy: sortField,
    sortOrder: sortDir ?? undefined,
  });

  const pages: DynamicPage[] = data?.data?.pages ?? [];
  const meta = data?.data?.meta;

  const { mutate: createPage, isPending: isCreating } = useCreatePage();
  const { mutate: updatePage, isPending: isUpdating } = useUpdatePage();
  const { mutate: deletePage, isPending: isDeleting } = useDeletePage();

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      // Cycle back to the default view
      setSortField("createdAt");
      setSortDir("desc");
    }
  }

  function handleLimitChange(v: number) {
    setLimit(v);
    setPg(1);
  }

  function handleSave(formData: PageFormValues) {
    if (formTarget === "new") {
      createPage(formData, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updatePage(
        { slug: formTarget.slug, payload: formData },
        { onSuccess: () => setFormTarget(null) },
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deletePage(deleteTarget.slug, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  function handleCopyLink(slug: string) {
    // Runs in a click handler, so `window` is always available.
    navigator.clipboard
      .writeText(`${window.location.origin}/page/${slug}`)
      .then(() => toast.success("Public link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  }

  function handleTogglePublish(page: DynamicPage) {
    updatePage({
      slug: page.slug,
      payload: { isPublished: !page.isPublished },
    });
  }

  const publishedCount =
    filter === "all" ? pages.filter(p => p.isPublished).length : null;
  const draftCount =
    filter === "all" ? pages.filter(p => !p.isPublished).length : null;

  return (
    <>
      <div className="flex min-h-screen flex-col gap-6">
        {/* ── Top Header Banner ── */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Dynamic Content & CMS Engine
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Dynamic Pages Manager
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                placeholder="Search pages…"
                className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-xs focus-visible:ring-amber-500 dark:border-slate-700 dark:bg-slate-900"
                onChange={e => {
                  setSearch(e.target.value);
                  setPg(1);
                }}
              />
            </div>
            <Button
              type="button"
              onClick={() => setFormTarget("new")}
              className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Page
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Total Pages"
            value={meta?.total?.toLocaleString() ?? "—"}
            sub="pages"
            accent="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
          <StatCard
            icon={Globe}
            label="Published"
            value={publishedCount?.toLocaleString() ?? "—"}
            sub={filter === "all" ? "this page" : undefined}
            accent="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
          />
          <StatCard
            icon={FileText}
            label="Drafts"
            value={draftCount?.toLocaleString() ?? "—"}
            sub={filter === "all" ? "this page" : undefined}
            accent="bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-300"
          />
          <StatCard
            icon={Layers}
            label="Current Page"
            value={meta ? `${meta.page}` : "—"}
            sub={meta ? `of ${meta.totalPages}` : undefined}
            accent="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
          />
        </div>

        {/* ── Table ── */}
        <div className="mx-6 mb-5 flex flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-6 py-3 dark:border-slate-800">
            <h2
              className="text-base font-normal text-stone-700 dark:text-slate-200"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              All Pages
            </h2>
            <div className="flex items-center gap-4">
              {meta && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500 dark:bg-slate-800 dark:text-slate-400">
                  {meta.total?.toLocaleString()} total
                </span>
              )}
              <PerPageSelect value={limit} onChange={handleLimitChange} />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-none items-center gap-1 border-b border-stone-100 px-6 py-2.5 dark:border-slate-800">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilter(tab.key);
                  setPg(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[720px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-stone-100 bg-stone-50/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/60">
                  <th className="px-6 py-3 text-left">
                    <SortButton
                      label="Page"
                      active={sortField === "title"}
                      dir={sortField === "title" ? sortDir : null}
                      onClick={() => handleSort("title")}
                    />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400 dark:text-slate-500">
                      Status
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <SortButton
                      label="Created"
                      active={sortField === "createdAt"}
                      dir={sortField === "createdAt" ? sortDir : null}
                      onClick={() => handleSort("createdAt")}
                    />
                  </th>
                  <th className="px-6 py-3 text-right">
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400 dark:text-slate-500">
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
                ) : pages.length > 0 ? (
                  pages.map(page => (
                    <tr
                      key={page.id}
                      className="group border-b border-stone-100 transition-colors last:border-none hover:bg-stone-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      {/* Page */}
                      <td className="px-6 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 transition-colors group-hover:bg-amber-100 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20">
                            <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-normal leading-snug text-stone-800 dark:text-slate-100"
                              style={{
                                fontFamily: "'DM Serif Display', Georgia, serif",
                              }}
                            >
                              {page.title}
                            </p>
                            <p className="flex items-center gap-1 font-mono text-[10px] text-stone-400 dark:text-slate-500">
                              <Globe className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">/{page.slug}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        <StatusBadge published={page.isPublished} />
                      </td>

                      {/* Created */}
                      <td className="px-6 py-3.5">
                        <span className="text-xs tabular-nums text-stone-400 dark:text-slate-500">
                          {formatDate(page.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewTarget(page)}
                            title="Preview"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10 dark:hover:text-sky-400"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(page.slug)}
                            title="Copy public link"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/10 dark:hover:text-teal-400"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormTarget(page)}
                            title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(page)}
                            title={
                              page.isPublished ? "Unpublish" : "Publish"
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                              page.isPublished
                                ? "border-stone-200 text-teal-500 hover:border-teal-200 hover:bg-teal-50 dark:border-slate-700 dark:text-teal-400 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/10"
                                : "border-stone-200 text-stone-400 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/10 dark:hover:text-teal-400"
                            }`}
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(page)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
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
                      colSpan={4}
                      className="py-16 text-center text-sm text-stone-400 dark:text-slate-500"
                    >
                      <div className="flex flex-col items-center">
                        <FileText className="mb-2 h-6 w-6 text-stone-200 dark:text-slate-700" />
                        {search || filter !== "all"
                          ? "No pages match your filters"
                          : "No pages yet"}
                        <button
                          type="button"
                          onClick={() => setFormTarget("new")}
                          className="mt-3 text-xs text-amber-500 hover:underline dark:text-amber-400"
                        >
                          Create your first page →
                        </button>
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
            <p className="text-xs font-light text-stone-400 dark:text-slate-500">
              Page{" "}
              <span className="font-medium text-stone-600 dark:text-slate-300">
                {meta.page}
              </span>{" "}
              of{" "}
              <span className="font-medium text-stone-600 dark:text-slate-300">
                {meta.totalPages}
              </span>
              &nbsp;·&nbsp;
              <span className="font-medium text-stone-600 dark:text-slate-300">
                {meta.total?.toLocaleString()}
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
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPg(p => p + 1)}
                className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {formTarget !== null && (
        <PageFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
          isSaving={isCreating || isUpdating}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          page={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
      {previewTarget && (
        <PreviewModal
          page={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </>
  );
}
