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

// ─── Helper: strip one outer <div> wrapper ─────────────────────────────────────
// The editor always emits <div>…content…</div>. When re-loading that value
// into the contentEditable we strip the outer div so users don't see nesting.
function unwrapDiv(html: string): string {
  const trimmed = html.trim();
  // Match a single wrapping <div> with no attributes
  const match = trimmed.match(/^<div>([\s\S]*)<\/div>$/i);
  return match ? match[1] : trimmed;
}

// ─── Helper: ensure saved HTML is wrapped in exactly one <div> ────────────────
function wrapInDiv(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "<div></div>";
  // Already correctly wrapped — don't double-wrap
  const match = trimmed.match(/^<div>([\s\S]*)<\/div>$/i);
  if (match) return trimmed;
  return `<div>${trimmed}</div>`;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────────
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
        // Prevent the editor from losing focus/selection when clicking toolbar
        e.preventDefault();
        onClick();
      }}
      title={title}
      className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-stone-200" />;
}

// ─── Field Error ───────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[11px] text-rose-500">{message}</p>;
}

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
  // Guard flag: prevents the useEffect from overwriting innerHTML while the
  // user is actively typing (which would reset cursor position).
  const isEmitting = useRef(false);

  // Sync external value → editor DOM.
  // Only runs when value changes from outside (e.g. form reset / edit load).
  useEffect(() => {
    if (!editorRef.current) return;
    if (isEmitting.current) {
      // This update was triggered by our own emit(); skip to avoid cursor reset.
      isEmitting.current = false;
      return;
    }
    const inner = unwrapDiv(value);
    // Avoid a no-op DOM mutation that would lose cursor position
    if (editorRef.current.innerHTML !== inner) {
      editorRef.current.innerHTML = inner;
    }
  }, [value]);

  // Emit the current editor content wrapped in a single <div>
  const emit = useCallback(() => {
    if (!editorRef.current) return;
    isEmitting.current = true;
    onChange(wrapInDiv(editorRef.current.innerHTML));
  }, [onChange]);

  // Execute a document.execCommand and then emit
  const exec = useCallback(
    (cmd: string, val?: string) => {
      // Re-focus the editor before executing so the selection is preserved
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
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
        error
          ? "border-rose-300 ring-2 ring-rose-100"
          : "border-stone-200 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100"
      }`}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 bg-stone-50 px-2 py-1.5">
        {/* Undo / Redo */}
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
            // Reset select back to placeholder so it reflects "current" state visually
            e.target.value = "p";
          }}
          defaultValue="p"
          className="h-7 cursor-pointer rounded border border-stone-200 bg-white px-1.5 text-[11px] text-stone-600 outline-none hover:border-stone-300"
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
          className="h-7 cursor-pointer rounded border border-stone-200 bg-white px-1.5 text-[11px] text-stone-600 outline-none hover:border-stone-300"
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
          <span className="font-bold text-[13px]">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic">
          <span className="italic text-[13px]">I</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline">
          <span className="underline text-[13px]">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough">
          <span className="line-through text-[13px]">S</span>
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
          {/* Hidden native color picker — triggered programmatically */}
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
            className="text-[11px] font-medium"
            style={{ background: "#fef08a", padding: "0 3px", borderRadius: 2 }}
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
          {/* Using a simple strikethrough text because emoji can be inconsistent */}
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
            // Prevent tab from moving focus away; insert non-breaking spaces instead
            e.preventDefault();
            exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();

            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            // Remove any selected text first
            range.deleteContents();

            // Insert a <br> at the current caret position
            const br = document.createElement("br");
            range.insertNode(br);

            // If the <br> is at the very end of the container (no following
            // sibling, or only an empty text node), the browser needs a second
            // <br> to render a visible empty line for the caret to sit on.
            const next = br.nextSibling;
            const atEnd =
              !next ||
              (next.nodeType === Node.TEXT_NODE &&
                (next.textContent === "" || next.textContent === "\n"));

            if (atEnd) {
              const trailingBr = document.createElement("br");
              br.after(trailingBr);
              // Position caret on the new empty line (before the trailing br)
              range.setStartBefore(trailingBr);
            } else {
              // Position caret right after the inserted br
              range.setStartAfter(br);
            }

            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            emit();
          }
          // Shift+Enter: let the browser handle it natively (it already inserts
          // a <br> in most engines), then emit so the value stays in sync.
        }}
        onKeyUp={e => {
          // Catch Shift+Enter's native <br> and sync it to form state
          if (e.key === "Enter" && e.shiftKey) {
            emit();
          }
        }}
        className="prose prose-sm min-h-52 max-w-none px-5 py-4 text-sm text-stone-700 outline-none"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  );
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
          wide ? "max-w-2xl" : "max-w-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-stone-100 bg-white p-5">
      <div className="mb-3 h-4 w-2/3 rounded-lg bg-stone-100" />
      <div className="mb-2 h-3 w-1/3 rounded bg-stone-100" />
      <div className="h-3 w-full rounded bg-stone-100" />
    </div>
  );
}

// ─── Page Form Modal ───────────────────────────────────────────────────────────
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
  // Track whether the user has manually edited the slug field so we don't
  // overwrite their custom slug with an auto-generated one on title change.
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

  // Auto-generate slug from title (create mode only, and only until the user
  // manually touches the slug field)
  const titleValue = watch("title");
  useEffect(() => {
    if (!slugEdited.current) {
      const generated = titleValue
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        // Collapse consecutive hyphens
        .replace(/-+/g, "-")
        // Strip leading/trailing hyphens
        .replace(/^-+|-+$/g, "");
      setValue("slug", generated, { shouldValidate: true });
    }
  }, [titleValue, setValue]);

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <h2
            className="text-lg font-normal text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {isEdit ? (
              <>
                Edit <em className="italic text-amber-600">{initial?.title}</em>
              </>
            ) : (
              <>
                New <em className="italic text-amber-600">Dynamic Page</em>
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
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Page Title
            </label>
            <Input
              {...register("title")}
              placeholder="e.g. Privacy Policy"
              className={`h-10 rounded-xl text-sm text-stone-700 shadow-none ${
                errors.title
                  ? "border-rose-300 focus-visible:ring-rose-200"
                  : "border-stone-200 focus-visible:ring-amber-400"
              }`}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              URL Slug
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                /
              </span>
              <Input
                {...register("slug", {
                  onChange: () => {
                    // Once the user manually types in this field, stop
                    // auto-generating from title
                    slugEdited.current = true;
                  },
                })}
                placeholder="privacy-policy"
                className={`h-10 rounded-xl pl-6 font-mono text-sm text-stone-600 shadow-none ${
                  errors.slug
                    ? "border-rose-300 focus-visible:ring-rose-200"
                    : "border-stone-200 focus-visible:ring-amber-400"
                }`}
              />
            </div>
            <FieldError message={errors.slug?.message} />
          </div>

          {/* Description (rich HTML) — must use Controller since contentEditable
              is uncontrolled and can't be driven by register() */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Content{" "}
              <span className="normal-case tracking-normal text-stone-300">
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
          <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                watch('isPublished') ? 'bg-teal-50' : 'bg-stone-100'
              }`}>
                <Globe className={`h-3.5 w-3.5 ${
                  watch('isPublished') ? 'text-teal-500' : 'text-stone-400'
                }`} />
              </div>
              <div>
                <p className="text-xs font-medium text-stone-700">
                  {watch('isPublished') ? 'Published' : 'Draft'}
                </p>
                <p className="text-[10px] text-stone-400">
                  {watch('isPublished')
                    ? 'This page is visible to everyone'
                    : 'Only admins can see this page'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={watch('isPublished')}
              onClick={() => setValue('isPublished', !watch('isPublished'), { shouldDirty: true })}
              className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                watch('isPublished') ? 'bg-teal-500' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                  watch('isPublished') ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
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
          Delete <em className="italic text-rose-500">{page.title}</em>?
        </h3>
        <p className="mt-1.5 text-sm text-stone-400">
          The page at{" "}
          <span className="font-mono text-xs text-stone-500">/{page.slug}</span>{" "}
          will be permanently removed. This action cannot be undone.
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
  const publicUrl = `${window.location.origin}/page/${page.slug}`;

  return (
    <ModalBackdrop onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
            <Eye className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <h2
              className="text-lg font-normal text-stone-800"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {page.title}
            </h2>
            <p className="font-mono text-[10px] text-stone-400">/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] text-sky-600 transition-colors hover:bg-sky-50"
          >
            <ExternalLink className="h-3 w-3" />
            Open public
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Render the stored HTML safely — the content was authored by an
          admin via the rich editor, not by end-users, so dangerouslySetInnerHTML
          is acceptable here. Consider DOMPurify if untrusted input is a concern. */}
      <div
        className="prose prose-sm max-h-[60vh] max-w-none overflow-y-auto px-6 py-5 text-stone-700"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        dangerouslySetInnerHTML={{ __html: page.description }}
      />
    </ModalBackdrop>
  );
}

// ─── Page Card ─────────────────────────────────────────────────────────────────
function PageCard({
  page,
  onEdit,
  onDelete,
  onPreview,
  onCopyLink,
  onTogglePublish,
}: {
  page: DynamicPage;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onCopyLink: () => void;
  onTogglePublish: () => void;
}) {
  // Strip HTML tags for the preview snippet
  const plainText = page.description.replace(/<[^>]+>/g, "").slice(0, 100);
  const publicUrl = `${window.location.origin}/page/${page.slug}`;

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-stone-100 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:border-stone-200 hover:shadow-md">
      {/* Published/Draft badge */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            page.isPublished
              ? "bg-teal-50 text-teal-600"
              : "bg-stone-100 text-stone-500"
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              page.isPublished ? "bg-teal-500" : "bg-stone-400"
            }`}
          />
          {page.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 transition-colors group-hover:bg-amber-100">
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-normal leading-snug text-stone-800"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {page.title}
            </p>
            <p className="flex items-center gap-1 font-mono text-[10px] text-stone-400">
              <Globe className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">/{page.slug}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onPreview}
            title="Preview"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-sky-50 hover:text-sky-500"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-amber-50 hover:text-amber-500"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-stone-400">
        {plainText || <em className="italic">No content yet…</em>}
      </p>

      <div className="flex items-center justify-between border-t border-stone-50 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopyLink}
            title="Copy public link"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-stone-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
          >
            <Copy className="h-3 w-3" />
            Copy link
          </button>
          {page.isPublished && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open public page"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-stone-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
            >
              <ExternalLink className="h-3 w-3" />
              View public
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!page.isPublished && (
            <button
              type="button"
              onClick={onTogglePublish}
              title="Publish"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-stone-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
            >
              <Globe className="h-3 w-3" />
              Publish
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-[10px] text-stone-400 transition-colors hover:text-amber-500"
          >
            Edit <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DynamicPagesPage() {
  const [pg, setPg] = useState(1);
  const limit = 6;
  const [search, setSearch] = useState("");

  const [formTarget, setFormTarget] = useState<DynamicPage | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DynamicPage | null>(null);
  const [previewTarget, setPreviewTarget] = useState<DynamicPage | null>(null);

  const { data, isLoading } = useGetAllPages({ page: pg, limit, search });
  const pages: DynamicPage[] = data?.data?.pages ?? [];
  const meta = data?.data?.meta;

  const { mutate: createPage, isPending: isCreating } = useCreatePage();
  const { mutate: updatePage, isPending: isUpdating } = useUpdatePage();
  const { mutate: deletePage, isPending: isDeleting } = useDeletePage();

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
                Platform Console
              </p>
              <h1
                className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                Dynamic <em className="italic text-amber-600">Pages</em>
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <Input
                  value={search}
                  placeholder="Search pages…"
                  className="h-10 rounded-xl border-stone-200 bg-white pl-9 text-sm text-stone-700 shadow-sm placeholder:text-stone-300 focus-visible:ring-amber-400"
                  onChange={e => {
                    setSearch(e.target.value);
                    setPg(1); // Reset to first page on new search
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setFormTarget("new")}
                className="h-10 rounded-xl bg-amber-500 px-4 text-sm text-white shadow-none hover:bg-amber-600"
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Page
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-stone-100 bg-white px-4 py-2.5 shadow-sm">
              <FileText className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Total Pages
                </p>
                <p
                  className="text-xl font-normal leading-none text-stone-800"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  {meta?.total ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-stone-100 bg-white px-4 py-2.5 shadow-sm">
              <Globe className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Published
                </p>
                <p
                  className="text-xl font-normal leading-none text-stone-800"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  {pages.filter(p => p.isPublished).length}{" "}
                  <span className="text-xs font-normal text-stone-400">
                    / {meta?.total ?? "—"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="px-6 pb-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: limit }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : pages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map(p => (
                <PageCard
                  key={p.id}
                  page={p}
                  onEdit={() => setFormTarget(p)}
                  onDelete={() => setDeleteTarget(p)}
                  onPreview={() => setPreviewTarget(p)}
                  onCopyLink={() => {
                    const url = `${window.location.origin}/page/${p.slug}`;
                    navigator.clipboard.writeText(url).catch(() => {
                      toast.error("Failed to copy link");
                    });
                    toast.success("Public link copied!");
                  }}
                  onTogglePublish={() => {
                    updatePage(
                      { slug: p.slug, payload: { isPublished: !p.isPublished } },
                      { onSuccess: () => toast.success(p.isPublished ? "Page unpublished" : "Page published") },
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-20">
              <FileText className="mb-3 h-8 w-8 text-stone-200" />
              <p className="text-sm text-stone-400">No pages found</p>
              <button
                type="button"
                onClick={() => setFormTarget("new")}
                className="mt-3 text-xs text-amber-500 hover:underline"
              >
                Create your first page →
              </button>
            </div>
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
