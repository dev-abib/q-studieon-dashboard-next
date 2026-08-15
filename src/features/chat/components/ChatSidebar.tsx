// src/features/chat/components/ChatSidebar.tsx
"use client";

import { useState } from "react";
import { useChatStore } from "../store/use-chat-store";
import type { ActiveConversation, StaffSummary } from "../types/chat.types";
import { GroupManageModal } from "./GroupManageModal";
import { useCreateGroup } from "../hooks/use-chat-groups";
import {
  Hash,
  MessageSquare,
  Plus,
  Circle,
  Search,
  Bell,
  BellRing,
} from "lucide-react";

interface Props {
  currentUserId: string;
  currentUserRole: string;
  isOwner?: boolean;
}

export function ChatSidebar({ currentUserId, currentUserRole, isOwner }: Props) {
  const {
    groups,
    dmPartners,
    staffList,
    onlineStaffIds,
    activeConversation,
    setActiveConversation,
    socket,
    unreadMentionCount,
    pendingMentions,
    clearPendingMentions,
    clearUnread,
    messages,
  } = useChatStore();

  const [dmSearch, setDmSearch] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

  const createGroup = useCreateGroup();
  const isSuperAdmin = currentUserRole === "super_admin" || isOwner;

  const openConversation = (conv: ActiveConversation) => {
    setActiveConversation(conv);
    // Join socket room
    if (conv.type === "group" && socket) {
      socket.emit("joinGroup", { groupId: conv.id });
    }
    // Mark as read
    if (socket) {
      socket.emit("markRead", {
        groupId: conv.type === "group" ? conv.id : undefined,
        dmPartnerId: conv.type === "dm" ? conv.id : undefined,
      });
    }
  };

  // Build DM list: start with existing threads, then the rest of staff
  const allStaff = staffList.filter((s) => s.id !== currentUserId);
  const filteredStaff = allStaff.filter(
    (s) =>
      s.name?.toLowerCase().includes(dmSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(dmSearch.toLowerCase())
  );

  const isActive = (conv: ActiveConversation) =>
    activeConversation?.type === conv.type && activeConversation?.id === conv.id;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-72 shrink-0">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Conversations</h2>
        </div>
        {/* Mention bell */}
        <button
          onClick={() => {
            setShowMentions((v) => !v);
            if (!showMentions) {
              clearUnread();
              clearPendingMentions();
            }
          }}
          className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          {unreadMentionCount > 0 ? (
            <BellRing className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadMentionCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadMentionCount > 9 ? "9+" : unreadMentionCount}
            </span>
          )}
        </button>
      </div>

      {/* Mention notification drawer */}
      {showMentions && pendingMentions.length > 0 && (
        <div className="mx-3 my-2 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden">
          <p className="px-3 py-1.5 text-xs font-semibold text-primary border-b border-primary/10">
            Recent Mentions
          </p>
          {pendingMentions.slice(-5).map((n, i) => (
            <div key={i} className="px-3 py-2 text-xs border-b last:border-0 border-primary/10">
              <span className="font-medium">{n.senderName}</span> mentioned you
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                "{n.contentSnippet}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {/* Groups */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
              Channels
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                title="Create group"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {groups.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1">
              {isSuperAdmin ? "Create your first channel →" : "No channels yet"}
            </p>
          ) : (
            <div className="space-y-0.5">
              {groups.map((g) => {
                const conv: ActiveConversation = { type: "group", id: g.id, label: g.name };
                const active = isActive(conv);
                const roomKey = `group:${g.id}`;
                const lastMsg = messages[roomKey]?.slice(-1)[0];

                return (
                  <button
                    key={g.id}
                    onClick={() => openConversation(conv)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left text-sm transition-all ${
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0 text-xs font-bold"
                      style={{ backgroundColor: g.avatarColor }}
                    >
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate block font-semibold text-slate-800 dark:text-slate-200">
                          {g.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                        {lastMsg
                          ? `${lastMsg.sender.name ?? "Someone"}: ${lastMsg.content || "📎 File"}`
                          : "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-slate-100 dark:border-slate-800 my-2" />

        {/* Direct Messages */}
        <div className="px-3 pb-4">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-1.5">
            Direct Messages
          </p>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Find a teammate…"
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-0.5">
            {filteredStaff.map((s) => {
              const conv: ActiveConversation = { type: "dm", id: s.id, label: s.name ?? "?" };
              const active = isActive(conv);
              const online = onlineStaffIds.includes(s.id);
              const roomKey = `dm:${s.id}`;
              const lastMsg = messages[roomKey]?.slice(-1)[0];

              return (
                <button
                  key={s.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left text-sm transition-all ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="relative shrink-0">
                    {s.profilePictureURL ? (
                      <img
                        src={s.profilePictureURL}
                        className="h-8 w-8 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <Circle
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 ${
                        online
                          ? "fill-emerald-500 text-emerald-500 border border-white dark:border-slate-900"
                          : "fill-slate-300 text-slate-300 dark:fill-slate-500 dark:text-slate-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate block font-medium text-slate-800 dark:text-slate-200">
                        {s.name}
                      </span>
                      {lastMsg && (
                        <span className="text-[9px] text-slate-400 font-normal">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                      {lastMsg ? lastMsg.content || "📎 File" : "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <GroupManageModal
          mode="create"
          staffList={staffList.filter((s) => s.id !== currentUserId)}
          isLoading={createGroup.isPending}
          onClose={() => setShowCreateGroup(false)}
          onConfirm={(payload) => {
            createGroup.mutate(payload, {
              onSuccess: () => setShowCreateGroup(false),
            });
          }}
        />
      )}
    </div>
  );
}
