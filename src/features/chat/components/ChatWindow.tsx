// src/features/chat/components/ChatWindow.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../store/use-chat-store";
import { useChatMessages } from "../hooks/use-chat-messages";
import { MessageBubble } from "./MessageBubble";
import { MentionInput } from "./MentionInput";
import type {
  ActiveConversation,
  ChatMessage,
  StaffSummary,
} from "../types/chat.types";
import { Hash, User, Loader2, ChevronUp, Settings, Users, UserPlus, Info, ArrowLeft } from "lucide-react";
import { chatApi } from "@/services/chat.api";
import { useQueryClient } from "@tanstack/react-query";
import { GroupManageModal } from "./GroupManageModal";
import { GroupInfoDrawer } from "./GroupInfoDrawer";
import { useUpdateGroup, useArchiveGroup } from "../hooks/use-chat-groups";

interface Props {
  conversation: ActiveConversation;
  currentUserId: string;
  currentUserRole: string;
  isOwner?: boolean;
  onStartDm: (partner: StaffSummary) => void;
}

export function ChatWindow({
  conversation,
  currentUserId,
  currentUserRole,
  isOwner,
  onStartDm,
}: Props) {
  const roomKey = `${conversation.type}:${conversation.id}`;
  const {
    messages,
    staffList,
    typing,
    socket,
    groups,
    onlineStaffIds,
  } = useChatStore();

  const updateGroup = useUpdateGroup();
  const archiveGroup = useArchiveGroup();
  const [showGroupManage, setShowGroupManage] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [flagPrompt, setFlagPrompt] = useState<string | null>(null);
  const [flagReasonValue, setFlagReasonValue] = useState("");

  const roomMessages = messages[roomKey] ?? [];
  const typingList = typing[roomKey] ?? [];

  // Load initial history
  const { isLoading } = useChatMessages(conversation);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || roomMessages.length <= 40) {
      el.scrollTop = el.scrollHeight;
    }
  }, [roomMessages.length]);

  // Load older messages
  const loadOlder = useCallback(async () => {
    const oldest = roomMessages[0];
    if (!oldest || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    try {
      const older =
        conversation.type === "group"
          ? await chatApi.getGroupMessages(conversation.id, oldest.id)
          : await chatApi.getDmMessages(conversation.id, oldest.id);
      if (older.length === 0) {
        setHasMore(false);
      } else {
        // Manually prepend
        useChatStore.getState().prependMessages(roomKey, [...older].reverse());
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [conversation, roomMessages, loadingOlder, hasMore, roomKey]);

  // ── Socket actions ──────────────────────────────────────────────────────────
  const sendMessage = (
    content: string,
    mentionedIds: string[],
    attachment?: {
      url: string;
      type: string;
      name: string;
      sizeBytes: number;
      publicId: string;
    }
  ) => {
    if (!socket) return;

    // Optimistically show the outgoing message right away instead of waiting
    // for the group-room broadcast echo (which can be delayed or lost while
    // the socket is reconnecting). The server echo replaces this temp message
    // via appendMessage's temp- dedupe.
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId: currentUserId,
      groupId: conversation.type === "group" ? conversation.id : null,
      dmPartnerId: conversation.type === "dm" ? conversation.id : null,
      content,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      isFlagged: false,
      flagReason: null,
      isAutoFlagged: false,
      autoFlagReason: null,
      attachmentUrl: attachment?.url ?? null,
      attachmentType: attachment?.type ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentSizeBytes: attachment?.sizeBytes ?? null,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId,
        name: null,
        email: null,
        role: currentUserRole,
        profilePictureURL: null,
      },
      mentions: [],
    };
    useChatStore.getState().appendMessage(roomKey, tempMsg);

    socket.emit(
      "sendMessage",
      {
        content,
        groupId: conversation.type === "group" ? conversation.id : undefined,
        dmPartnerId: conversation.type === "dm" ? conversation.id : undefined,
        mentionedIds,
        attachmentUrl: attachment?.url,
        attachmentType: attachment?.type,
        attachmentName: attachment?.name,
        attachmentSizeBytes: attachment?.sizeBytes,
        attachmentPublicId: attachment?.publicId,
      },
      (res?: { success?: boolean; message?: ChatMessage; error?: string }) => {
        // Server confirmed the save — swap the temp copy for the real message
        // (faster than waiting for the room broadcast).
        if (res?.success && res?.message) {
          useChatStore
            .getState()
            .replaceTempMessage(roomKey, tempMsg.id, res.message);
          return;
        }
        // Server rejected the message — drop the stuck temp so it doesn't
        // linger as a ghost, and tell the user.
        useChatStore.getState().removeTempMessage(roomKey, tempMsg.id);
        useChatStore
          .getState()
          .showToast(
            "Message failed to send",
            res?.error || "Please check your connection and try again"
          );
      }
    );
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket) return;
    socket.emit("typing", {
      groupId: conversation.type === "group" ? conversation.id : undefined,
      dmPartnerId: conversation.type === "dm" ? conversation.id : undefined,
      isTyping,
    });
  };

  const handleEdit = (messageId: string, content: string) => {
    if (!socket) return;
    socket.emit("editMessage", {
      messageId,
      content,
      groupId: conversation.type === "group" ? conversation.id : undefined,
      dmPartnerId: conversation.type === "dm" ? conversation.id : undefined,
    });
  };

  const handleDelete = (messageId: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", {
      messageId,
      groupId: conversation.type === "group" ? conversation.id : undefined,
      dmPartnerId: conversation.type === "dm" ? conversation.id : undefined,
    });
  };

  const handleFlag = (messageId: string) => {
    setFlagPrompt(messageId);
    setFlagReasonValue("");
  };

  const confirmFlag = async () => {
    if (!flagPrompt || !flagReasonValue.trim()) return;
    await chatApi.flagMessage(flagPrompt, flagReasonValue.trim());
    setFlagPrompt(null);
    qc.invalidateQueries({ queryKey: ["chat", "surveillance"] });
  };

  const isSuperAdmin = currentUserRole === "super_admin" || isOwner;

  // Header info
  const group =
    conversation.type === "group"
      ? groups.find((g) => g.id === conversation.id)
      : null;
  const dmPartner =
    conversation.type === "dm"
      ? staffList.find((s) => s.id === conversation.id)
      : null;

  return (
    <div className="flex h-full min-w-0 flex-1 overflow-hidden relative">
      <div className="flex flex-col h-full min-w-0 flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        {/* Mobile Back to Conversations Button */}
        <button
          type="button"
          onClick={() => useChatStore.getState().setActiveConversation(null)}
          className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {conversation.type === "group" ? (
          <>
            {group?.avatarUrl ? (
              <img
                src={group.avatarUrl}
                alt={group.name}
                className="h-10 w-10 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm text-sm font-bold"
                style={{ backgroundColor: group?.avatarColor ?? "#6366f1" }}
              >
                {group?.name?.slice(0, 2).toUpperCase() || <Hash className="h-5 w-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {group?.name ?? conversation.label}
                </p>
                {group && (
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                    {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {group?.description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md">
                  {group.description}
                </p>
              )}
            </div>

            {/* Group Members Avatars Stack */}
            {group && (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <div className="hidden sm:flex items-center -space-x-2 overflow-hidden mr-2">
                  {group.members.slice(0, 5).map((m) => (
                    <div
                      key={m.staffId}
                      title={m.staff?.name ?? "Member"}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    >
                      {m.staff?.profilePictureURL ? (
                        <img src={m.staff.profilePictureURL} className="h-full w-full rounded-full object-cover" alt="" />
                      ) : (
                        m.staff?.name?.[0]?.toUpperCase() ?? "M"
                      )}
                    </div>
                  ))}
                  {group.members.length > 5 && (
                    <div className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      +{group.members.length - 5}
                    </div>
                  )}
                </div>

                {/* Group Info & Settings Buttons */}
                <button
                  onClick={() => setShowGroupInfo((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-sm ${
                    showGroupInfo
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>Group Info</span>
                </button>

                {(currentUserRole === "super_admin" || isOwner || group.createdById === currentUserId) && (
                  <button
                    onClick={() => setShowGroupManage(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-sm"
                  >
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    <span>Settings</span>
                  </button>
                )}
              </div>
            )}

            {/* Group Manage Modal */}
            {showGroupManage && group && (
              <GroupManageModal
                mode="edit"
                group={group}
                staffList={staffList}
                isLoading={updateGroup.isPending || archiveGroup.isPending}
                onConfirm={(payload) => {
                  updateGroup.mutate(
                    { groupId: group.id, payload },
                    {
                      onSuccess: () => setShowGroupManage(false),
                      onError: (err: any) => {
                        alert(err?.response?.data?.message || "Failed to save group changes");
                      },
                    }
                  );
                }}
                onArchive={() => {
                  archiveGroup.mutate(group.id, {
                    onSuccess: () => setShowGroupManage(false),
                    onError: (err: any) => {
                      alert(err?.response?.data?.message || "Failed to archive group");
                    },
                  });
                }}
                onClose={() => setShowGroupManage(false)}
              />
            )}
          </>
        ) : (() => {
          const isOnline = dmPartner ? onlineStaffIds.includes(dmPartner.id) : false;
          return (
            <>
              <div className="relative shrink-0">
                {dmPartner?.profilePictureURL ? (
                  <img
                    src={dmPartner.profilePictureURL}
                    className="h-8 w-8 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500">
                    {dmPartner?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white dark:border-slate-900 ${
                    isOnline ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                  {dmPartner?.name ?? conversation.label}
                </p>
                {dmPartner && (
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    {isOnline ? "Active now" : "Offline"}
                  </p>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
      >
        {/* Load older button */}
        {hasMore && roomMessages.length >= 40 && (
          <div className="flex justify-center mb-3">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-primary/10"
            >
              {loadingOlder ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
              Load older messages
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        ) : roomMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
            <MessageSquarePlaceholder />
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          roomMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isOwner={isOwner}
              onStartDm={onStartDm}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFlag={isSuperAdmin ? handleFlag : undefined}
            />
          ))
        )}
      </div>

      {/* Floating Typing Indicator */}
      {typingList.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <div className="flex gap-0.5 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">
            {typingList.map((t) => t.staffName).join(", ")}{" "}
            {typingList.length === 1 ? "is" : "are"} typing…
          </span>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <MentionInput
          staffList={staffList}
          onSend={sendMessage}
          onTyping={handleTyping}
          disabled={!socket}
          placeholder={
            socket
              ? `Message ${conversation.type === "group" ? `#${conversation.label}` : conversation.label}…`
              : "Connecting…"
          }
        />
      </div>

      {/* Flag confirm dialog */}
      {flagPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Flag Message</h3>
            <input
              autoFocus
              value={flagReasonValue}
              onChange={(e) => setFlagReasonValue(e.target.value)}
              placeholder="Reason for flagging…"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setFlagPrompt(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmFlag}
                disabled={!flagReasonValue.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                Flag
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Side-by-side Group Info Drawer */}
      {showGroupInfo && group && (
        <GroupInfoDrawer
          group={group}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isOwner={isOwner}
          onlineStaffIds={onlineStaffIds}
          onStartDm={onStartDm}
          onEditGroup={() => {
            setShowGroupInfo(false);
            setShowGroupManage(true);
          }}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
}

function MessageSquarePlaceholder() {
  return (
    <svg
      className="h-10 w-10 opacity-20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}
