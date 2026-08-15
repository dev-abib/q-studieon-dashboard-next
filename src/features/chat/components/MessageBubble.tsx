// src/features/chat/components/MessageBubble.tsx
"use client";

import { useState } from "react";
import type { ChatMessage, StaffSummary } from "../types/chat.types";
import { useChatStore } from "../store/use-chat-store";
import { UserProfileCard } from "./UserProfileCard";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { Edit2, Trash2, Flag, AlertTriangle, ShieldAlert, FileText, Image as ImageIcon, Video, Music } from "lucide-react";

interface Props {
  message: ChatMessage;
  currentUserId: string;
  currentUserRole: string;
  isOwner?: boolean;
  onStartDm: (partner: StaffSummary) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onFlag?: (messageId: string) => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseContent(content: string, mentions: ChatMessage["mentions"], isSelf?: boolean) {
  if (!content) return "";

  const markClass = isSelf
    ? "bg-white/30 text-white rounded px-1.5 py-0.5 font-bold"
    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded px-1.5 py-0.5 font-bold";

  let result = content;

  // Highlight @everyone / @all / @channel tags
  result = result.replace(
    /(^|\s)@(everyone|all|channel)(?=\s|$|[.,!?;:])/gi,
    `$1<mark class="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 font-bold rounded px-1.5 py-0.5">@$2</mark>`
  );

  if (mentions?.length) {
    for (const m of mentions) {
      const name = m.mentioned?.name ?? "someone";
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(
        new RegExp(`(^|\\s)@${escaped}(?=\\s|$|[.,!?;:])`, "gi"),
        `$1<mark class="${markClass}">@${name}</mark>`
      );
    }
  }

  // Fallback regex for unmatched @Name
  result = result.replace(
    /(^|\s)@([A-Z][a-z0-9_]+(?:\s[A-Z][a-z0-9_]+)?)(?=\s|$|[.,!?;:])/g,
    (match, p1, p2) => {
      if (result.includes(`<mark`)) return match;
      return `${p1}<mark class="${markClass}">@${p2}</mark>`;
    }
  );

  return result;
}

export function MessageBubble({
  message,
  currentUserId,
  currentUserRole,
  isOwner,
  onStartDm,
  onEdit,
  onDelete,
  onFlag,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showImageModal, setShowImageModal] = useState(false);

  const isSelf = message.senderId === currentUserId;
  const isSuperAdmin = currentUserRole === "super_admin" || isOwner;

  if (message.isDeleted) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 text-xs text-slate-400 dark:text-slate-600 italic ${isSelf ? 'justify-end' : 'justify-start'}`}>
        <Trash2 className="h-3.5 w-3.5" />
        This message was deleted.
      </div>
    );
  }

  const handleEditSubmit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group flex items-start gap-3.5 px-3 py-1.5 rounded-2xl transition-colors relative w-full ${
        isSelf ? "justify-end" : "justify-start"
      } ${
        message.isAutoFlagged || message.isFlagged
          ? "border-l-2 border-red-500 pl-3 bg-red-50/20 dark:bg-red-950/10"
          : ""
      }`}
    >
      {/* Avatar (Only show for incoming messages) */}
      {!isSelf && (
        <UserProfileCard
          staff={message.sender}
          onStartDm={() => onStartDm(message.sender)}
        >
          {message.sender.profilePictureURL ? (
            <img
              src={message.sender.profilePictureURL}
              alt={message.sender.name ?? ""}
              className="h-9 w-9 rounded-full object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all mt-0.5"
            />
          ) : (
            <div className="h-9 w-9 rounded-full shrink-0 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:ring-2 hover:ring-primary transition-all mt-0.5">
              {message.sender.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </UserProfileCard>
      )}

      {/* Message Bubble Body */}
      <div className={`flex flex-col max-w-[70%] min-w-0 ${isSelf ? "items-end" : "items-start"}`}>
        {/* Name and Time Header */}
        <div className="flex items-center gap-2 mb-1">
          {!isSelf && (
            <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
              {message.sender.name ?? "Unknown"}
            </span>
          )}
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatTime(message.createdAt)}
            {message.isEdited && <span className="ml-1 italic">(edited)</span>}
          </span>
          {(message.isAutoFlagged || message.isFlagged) && (
            <span className="flex items-center gap-0.5 text-[9px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">
              <ShieldAlert className="h-3 w-3" />
              {message.isFlagged ? "Flagged" : "Auto-flagged"}
            </span>
          )}
        </div>

        {/* Text/Content Box */}
        {isEditing ? (
          <div className="mt-1 flex items-center gap-2 w-full">
            <input
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleEditSubmit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="flex-1 text-sm rounded-xl border border-primary/50 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleEditSubmit} className="text-xs font-medium text-primary hover:underline">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:underline">
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-1 w-full flex flex-col">
            {message.content && (
              <div
                className={`text-sm px-4 py-2.5 rounded-2xl leading-relaxed break-words inline-block ${
                  isSelf
                    ? "bg-primary text-primary-foreground rounded-tr-none font-medium shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50"
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: parseContent(message.content, message.mentions, isSelf),
                  }}
                />
              </div>
            )}

            {/* Attachments rendering */}
            {message.attachmentUrl && (() => {
              const url = message.attachmentUrl;
              const type = message.attachmentType?.toLowerCase();
              const isImage =
                type === "image" ||
                /\.(jpeg|jpg|gif|png|webp|svg|bmp)($|\?)/i.test(url) ||
                url.includes("/image/upload/") ||
                url.includes("cloudinary.com");
              const isVideo =
                type === "video" ||
                /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) ||
                url.includes("/video/upload/");
              const isAudio =
                type === "audio" ||
                /\.(mp3|wav|ogg|aac|flac|m4a)($|\?)/i.test(url);

              return (
                <div className={`mt-1.5 max-w-sm w-full flex ${isSelf ? "justify-end" : "justify-start"}`}>
                  {isImage && (
                    <>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 group/img shadow-sm max-w-full">
                        <img
                          src={url}
                          alt={message.attachmentName ?? "Image"}
                          className="max-h-56 w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setShowImageModal(true)}
                        />
                        <div
                          className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity px-2 py-1 text-white cursor-pointer flex items-center gap-1"
                          onClick={() => setShowImageModal(true)}
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span className="text-[10px] font-medium">Expand Preview</span>
                        </div>
                      </div>

                      {showImageModal && (
                        <ImagePreviewModal
                          imageUrl={url}
                          imageName={message.attachmentName ?? "Image"}
                          senderName={message.sender.name ?? undefined}
                          onClose={() => setShowImageModal(false)}
                        />
                      )}
                    </>
                  )}

                  {isVideo && (
                    <video
                      src={url}
                      controls
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 max-h-56 w-full bg-black shadow-sm"
                    />
                  )}

                  {isAudio && (
                    <audio
                      src={url}
                      controls
                      className="w-full h-9 shadow-sm"
                    />
                  )}

                  {!isImage && !isVideo && !isAudio && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group/file shadow-sm w-full"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {message.attachmentName}
                          </p>
                          {message.attachmentSizeBytes && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {message.attachmentSizeBytes < 1024 * 1024
                                ? `${(message.attachmentSizeBytes / 1024).toFixed(1)} KB`
                                : `${(message.attachmentSizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="p-2 rounded-xl text-slate-400 group-hover/file:text-slate-600 dark:group-hover/file:text-slate-250 group-hover/file:bg-slate-200/60 dark:group-hover/file:bg-slate-700/60 transition-all">
                        <FileText className="h-4 w-4" />
                      </span>
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Audit/Alert reasons */}
        {message.autoFlagReason && isSuperAdmin && (
          <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {message.autoFlagReason}
          </p>
        )}
        {message.flagReason && isSuperAdmin && (
          <p className="mt-1 text-[10px] text-orange-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Flagged: {message.flagReason}
          </p>
        )}
      </div>

      {/* Hover Action Menu */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-md p-1.5 z-10 ${
          isSelf ? "left-4" : "right-4"
        }`}
      >
        {isSelf && onEdit && (
          <button
            onClick={() => setIsEditing(true)}
            title="Edit message"
            className="p-1.5 rounded-lg text-slate-450 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
        {(isSelf || isSuperAdmin) && onDelete && (
          <button
            onClick={() => onDelete(message.id)}
            title={`Delete message by ${message.sender.name ?? "user"}`}
            className="p-1.5 rounded-lg text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {isSuperAdmin && !message.isFlagged && onFlag && (
          <button
            onClick={() => onFlag(message.id)}
            title={`Flag message by ${message.sender.name ?? "user"}`}
            className="p-1.5 rounded-lg text-slate-450 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
