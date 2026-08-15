import { useState, useRef, useCallback } from "react";
import type { StaffSummary } from "../types/chat.types";
import { Send, Paperclip, X, FileText, Image as ImageIcon, Video, Music, Loader2 } from "lucide-react";
import { chatApi } from "@/services/chat.api";

interface Props {
  staffList: StaffSummary[];
  onSend: (
    content: string,
    mentionedIds: string[],
    attachment?: {
      url: string;
      type: string;
      name: string;
      sizeBytes: number;
      publicId: string;
    }
  ) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MentionInput({ staffList, onSend, onTyping, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<StaffSummary[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    type: string;
    name: string;
    sizeBytes: number;
    publicId: string;
  } | null>(null);

  // Collect @mentions from value.
  const extractMentionedIds = useCallback(
    (text: string): string[] => {
      const ids = new Set<string>();

      // Check if text mentions everyone / all / channel
      const mentionsEveryone = /(^|\s)@(everyone|all|channel)(?=\s|$|[.,!?;:])/i.test(text);
      if (mentionsEveryone) {
        staffList.forEach((s) => ids.add(s.id));
      }

      // Individual user mentions
      staffList.forEach((s) => {
        if (!s.name) return;
        const escaped = s.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(^|\\s)@${escaped}(?=\\s|$|[.,!?;:])`, "i");
        if (re.test(text)) {
          ids.add(s.id);
        }
      });

      return Array.from(ids);
    },
    [staffList]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);

    // Detect @mention trigger
    const cursor = e.target.selectionStart ?? 0;
    const before = text.slice(0, cursor);
    const match = before.match(/@([\w\s]*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      setMentionQuery(q);

      const everyoneItem: StaffSummary = {
        id: "EVERYONE_TAG",
        name: "everyone",
        email: "Notify all group members",
        role: "system",
        profilePictureURL: null,
      };

      const matchedStaff = staffList.filter((s) =>
        s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
      );

      const items: StaffSummary[] = [];
      if ("everyone".startsWith(q) || "all".startsWith(q) || q === "") {
        items.push(everyoneItem);
      }
      items.push(...matchedStaff);

      setSuggestions(items.slice(0, 7));
      setSelectedSuggestion(0);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }

    // Typing indicator debounce
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTyping(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestion((s) => (s + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestion((s) => (s - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedSuggestion]);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMention = (staff: StaffSummary) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const replaced = before.replace(/@([\w\s]*)$/, `@${staff.name} `);
    setValue(replaced + after);
    setSuggestions([]);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await chatApi.uploadAttachment(file);
      if (uploaded?.url) {
        setAttachment({
          url: uploaded.url,
          type: uploaded.type,
          name: uploaded.name,
          sizeBytes: uploaded.sizeBytes,
          publicId: uploaded.publicId,
        });
      } else {
        throw new Error("No URL returned");
      }
    } catch (error) {
      console.warn("[Attachment Upload] Cloudinary upload unavailable, using Data URL fallback:", error);
      const mime = file.type;
      let type = "document";
      if (mime.startsWith("image/")) type = "image";
      else if (mime.startsWith("video/")) type = "video";
      else if (mime.startsWith("audio/")) type = "audio";

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAttachment({
            url: reader.result,
            type,
            name: file.name,
            sizeBytes: file.size,
            publicId: `local-${Date.now()}`,
          });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed && !attachment) return;
    const ids = extractMentionedIds(trimmed);
    onSend(trimmed, ids, attachment ?? undefined);
    setValue("");
    setAttachment(null);
    setSuggestions([]);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping(false);
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4 text-emerald-500" />;
      case "video":
        return <Video className="h-4 w-4 text-rose-500" />;
      case "audio":
        return <Music className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative space-y-2">
      {/* Mention suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => insertMention(s)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                i === selectedSuggestion
                  ? "bg-primary/10 text-primary"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {s.profilePictureURL ? (
                <img src={s.profilePictureURL} className="h-6 w-6 rounded-full object-cover" alt="" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  {s.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{s.role}</span>
            </button>
          ))}
        </div>
      )}

      {/* Attachment upload / preview badge */}
      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 border border-dashed border-slate-200 dark:border-slate-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Uploading attachment...</span>
        </div>
      )}

      {attachment && (() => {
        const type = attachment.type?.toLowerCase();
        const isImg =
          type === "image" ||
          /\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i.test(attachment.url) ||
          attachment.url.includes("/image/upload/") ||
          attachment.url.includes("cloudinary.com");
        return (
          <div className="flex items-center justify-between gap-3 text-xs bg-slate-100 dark:bg-slate-800 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-3 min-w-0">
              {isImg ? (
                <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-black/5">
                  <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  {getAttachmentIcon(attachment.type)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                  {attachment.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isImg ? "Image attachment • " : ""}{formatSize(attachment.sizeBytes)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAttachment(null)}
              title="Remove attachment"
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })()}

      {/* Input row */}
      <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
        {/* Paperclip upload trigger */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-40"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? "Type a message… use @ to mention"}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none max-h-32 leading-relaxed"
          style={{ fieldSizing: "content" } as any}
        />
        <button
          onClick={handleSend}
          disabled={disabled || isUploading || (!value.trim() && !attachment)}
          className="shrink-0 h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
