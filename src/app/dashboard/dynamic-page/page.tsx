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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
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
      "Only lowercase letters, numbers and hyphens allowed"
    ),
  description: z
    .string()
    .min(1, "Content is required")
    .refine(
      val => val.replace(/<[^>]+>/g, "").trim().length > 0,
      "Content cannot be empty"
    ),
  isPublished: z.boolean().optional(),
});

type PageFormValues = z.infer<typeof pageSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function unwrapDiv(html: string): string {
  const trimmed = html.trim();
  const match = trimmed.match(/^<div>([\s\S]*)<\/div>$/i);
  return match ? match[1] : trimmed;
}

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

// ─── Rich Text Editor Primitives ──────────────────────────────────────────────
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
        e.preventDefault();
        onClick();
      }}
      title={title}
      className="flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />;
}

const SELECT_CLASS =
  "h-7 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 focus:outline-none hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600";

// ─── Rich Text Editor Component ────────────────────────────────────────────────
function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const currentHTML = el.innerHTML;
    const targetBody = unwrapDiv(value);
    if (currentHTML !== targetBody && !isInternalChange.current) {
      el.innerHTML = targetBody;
    }
    isInternalChange.current = false;
  }, [value]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(wrapInDiv(el.innerHTML));
  }, [onChange]);

  const exec = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    emit();
  };

  const handleLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
        {/* Paragraph / Headings */}
        <select
          onChange={e => exec("formatBlock", e.target.value)}
          defaultValue="p"
          className={SELECT_CLASS}
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <ToolDivider />

        {/* Text formatting */}
        <ToolBtn onClick={() => exec("bold")} title="Bold">
          <strong className="font-extrabold">B</strong>
        </ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic">
          <em className="italic">I</em>
        </ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline">
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough">
          <span className="line-through font-bold">S</span>
        </ToolBtn>

        <ToolDivider />

        {/* Text Alignment */}
        <ToolBtn onClick={() => exec("justifyLeft")} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Align Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolDivider />

        {/* Lists */}
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolDivider />

        {/* Link & HR */}
        <ToolBtn onClick={handleLink} title="Insert Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal Line">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Color picker */}
        <div className="relative flex items-center">
          <ToolBtn
            onClick={() => colorInputRef.current?.click()}
            title="Text Color"
          >
            <Palette className="h-3.5 w-3.5 text-amber-500" />
          </ToolBtn>
          <input
            ref={colorInputRef}
            type="color"
            onChange={e => exec("foreColor", e.target.value)}
            className="sr-only"
          />
        </div>

        <ToolDivider />

        {/* Undo / Redo */}
        <ToolBtn onClick={() => exec("undo")} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* ContentEditable input area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={emit}
        className="rich-content min-h-56 max-w-none px-5 py-4 outline-none text-slate-800 dark:text-slate-200"
      />
    </div>
  );
}

// ─── Field Error ───────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md">
      <div
        ref={panelRef}
        className={`relative my-auto w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Page Form Modal (Create / Edit) ───────────────────────────────────────────
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

  return (
    <ModalBackdrop onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Edit Dynamic Page" : "Create New Dynamic Page"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit ? `Modifying page: ${initial?.slug}` : "Add custom rich text CMS content"}
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

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSave)} className="p-6 flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Page Title <span className="text-primary">*</span>
          </label>
          <Input
            {...register("title")}
            placeholder="e.g. Terms & Conditions"
            className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
          />
          <FieldError message={errors.title?.message} />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            URL Slug <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
              /
            </span>
            <Input
              {...register("slug")}
              placeholder="terms-and-conditions"
              onChange={e => {
                slugEdited.current = true;
                register("slug").onChange(e);
              }}
              className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 pl-7 text-sm font-mono text-slate-800 dark:text-slate-200 focus-visible:ring-primary dark:bg-slate-800/40"
            />
          </div>
          <FieldError message={errors.slug?.message} />
        </div>

        {/* Rich Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Page Content (Rich Text) <span className="text-primary">*</span>
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={val => field.onChange(val)}
              />
            )}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* Status Toggle Card */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isPublished ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-200/60 text-slate-500 border-slate-300 dark:bg-slate-800 dark:border-slate-700"}`}>
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Publish Status
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isPublished ? "Visible to public visitors at /page/[slug]" : "Hidden draft state"}
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              {...register("isPublished")}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 peer-focus:outline-none dark:bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
                Saving Page...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? "Update Page" : "Publish Page"}
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({
  page,
  onConfirm,
  onClose,
  isDeleting,
}: {
  page: DynamicPage;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
          <Trash2 className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Delete Dynamic Page?
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">/{page.slug}</span>? This action cannot be undone.
        </p>

        <div className="mt-6 flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-xl bg-rose-500 text-xs font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Page"}
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
  return (
    <ModalBackdrop onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Eye className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {page.title}
            </h2>
            <p className="text-xs font-mono text-slate-400">/{page.slug}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-6">
        <div
          className="rich-content rich-content-lg"
          dangerouslySetInnerHTML={{ __html: page.description }}
        />
      </div>

      <div className="flex justify-end px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-9 px-4 text-xs font-semibold rounded-xl"
        >
          Close Preview
        </Button>
      </div>
    </ModalBackdrop>
  );
}

// ─── Stat Card Component ───────────────────────────────────────────────────────
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

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        published
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
        }`}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

// ─── Filter Tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS: { key: PageFilter; label: string }[] = [
  { key: "all", label: "All Pages" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
];

// ─── Main Admin Dynamic Pages Component ────────────────────────────────────────
export default function DynamicPagesPage() {
  const [pg, setPg] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PageFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [formTarget, setFormTarget] = useState<DynamicPage | "new" | null>(null);
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

  function handleSave(formData: PageFormValues) {
    if (formTarget === "new") {
      createPage(formData, { onSuccess: () => setFormTarget(null) });
    } else if (formTarget) {
      updatePage(
        { slug: formTarget.slug, payload: formData },
        { onSuccess: () => setFormTarget(null) }
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
    navigator.clipboard
      .writeText(`${window.location.origin}/page/${slug}`)
      .then(() => toast.success("Public page link copied!"))
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
    <section className="w-full flex flex-col gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="CMS & Dynamic Content"
        title="Dynamic Pages Manager"
        icon={Globe}
        description="Create, edit, and publish dynamic rich text web pages and legal docs"
      >
        <Button
          type="button"
          onClick={() => setFormTarget("new")}
          className="h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Page
        </Button>
      </PageHeader>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Total Pages"
          value={meta?.total?.toLocaleString() ?? "—"}
          sub="pages"
          accent="bg-primary/10 text-primary border-primary/20"
        />
        <StatCard
          icon={Globe}
          label="Published Pages"
          value={publishedCount?.toLocaleString() ?? "—"}
          sub="live"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        />
        <StatCard
          icon={FileCode}
          label="Draft Pages"
          value={draftCount?.toLocaleString() ?? "—"}
          sub="drafts"
          accent="bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20"
        />
      </div>

      {/* ── Table Card Container ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilter(tab.key);
                    setPg(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === tab.key
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              placeholder="Search by title or slug…"
              className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 pl-10 text-xs focus-visible:ring-primary"
              onChange={e => {
                setSearch(e.target.value);
                setPg(1);
              }}
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="px-6 py-3.5">Page Title & Slug</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created Date</th>
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
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No dynamic pages found.
                  </td>
                </tr>
              ) : (
                pages.map(page => (
                  <tr
                    key={page.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Title & Slug */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {page.title}
                        </span>
                        <span className="font-mono text-[11px] text-primary">
                          /{page.slug}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge published={page.isPublished} />
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {formatDate(page.createdAt)}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewTarget(page)}
                          title="Quick Preview"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Copy Link */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(page.slug)}
                          title="Copy Public Link"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        {/* View Live */}
                        <a
                          href={`/page/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Live Public Page"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        {/* Edit */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormTarget(page)}
                          title="Edit Page"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(page)}
                          title="Delete Page"
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
                disabled={pg <= 1}
                onClick={() => setPg(p => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-lg text-xs font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pg >= meta.totalPages}
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
        <PageFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
          isSaving={isCreating || isUpdating}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          page={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      {previewTarget && (
        <PreviewModal
          page={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </section>
  );
}
