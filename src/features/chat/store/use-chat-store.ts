// src/features/chat/store/use-chat-store.ts
"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Socket } from "socket.io-client";
import type {
  ChatMessage,
  ChatGroup,
  StaffSummary,
  ActiveConversation,
  TypingIndicator,
  MentionNotification,
} from "../types/chat.types";

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  type: "task" | "inquiry" | "mention" | "alert" | "system";
  timestamp: Date;
  read: boolean;
}

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  activeConversation: ActiveConversation | null;
  // keyed by "group:<groupId>" or "dm:<partnerId>"
  messages: Record<string, ChatMessage[]>;
  groups: ChatGroup[];
  dmPartners: StaffSummary[];
  staffList: StaffSummary[];
  onlineStaffIds: string[];
  typing: Record<string, TypingIndicator[]>; // roomKey → list
  unreadMentionCount: number;
  pendingMentions: MentionNotification[];
  isSurveillanceJoined: boolean;
  toast: { title: string; body: string; visible: boolean } | null;
  systemNotifications: SystemNotification[];
  unreadSystemCount: number;

  // Actions
  showToast: (title: string, body: string) => void;
  hideToast: () => void;
  setSocket: (socket: Socket | null) => void;
  setConnected: (v: boolean) => void;
  setActiveConversation: (conv: ActiveConversation | null) => void;
  setGroups: (groups: ChatGroup[]) => void;
  setDmPartners: (partners: StaffSummary[]) => void;
  setStaffList: (list: StaffSummary[]) => void;
  setOnlineStaff: (ids: string[]) => void;
  prependMessages: (roomKey: string, msgs: ChatMessage[]) => void;
  appendMessage: (roomKey: string, msg: ChatMessage) => void;
  replaceMessage: (roomKey: string, msg: ChatMessage) => void;
  removeMessage: (roomKey: string, messageId: string) => void;
  // Optimistic (temp-) message bookkeeping
  replaceTempMessage: (roomKey: string, tempId: string, msg: ChatMessage) => void;
  removeTempMessage: (roomKey: string, tempId: string) => void;
  pruneStuckTempMessages: (maxAgeMs?: number) => void;
  setTyping: (roomKey: string, indicator: TypingIndicator) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  addPendingMention: (n: MentionNotification) => void;
  clearPendingMentions: () => void;
  setSurveillanceJoined: (v: boolean) => void;
  addSystemNotification: (n: Omit<SystemNotification, "id" | "timestamp" | "read">) => void;
  clearSystemNotifications: () => void;
  markSystemNotificationsRead: () => void;
}

const roomKey = (conv: ActiveConversation) =>
  `${conv.type}:${conv.id}`;

export const useChatStore = create<ChatState>()(
  immer((set) => ({
    socket: null,
    isConnected: false,
    activeConversation: null,
    messages: {},
    groups: [],
    dmPartners: [],
    staffList: [],
    onlineStaffIds: [],
    typing: {},
    unreadMentionCount: 0,
    pendingMentions: [],
    isSurveillanceJoined: false,
    toast: null,
    systemNotifications: [],
    unreadSystemCount: 0,

    showToast: (title, body) => set({ toast: { title, body, visible: true } }),
    hideToast: () => set({ toast: null }),

    setSocket: (socket) => set({ socket }),
    setConnected: (v) => set({ isConnected: v }),
    setActiveConversation: (conv) => set({ activeConversation: conv }),
    setGroups: (groups) => set({ groups }),
    setDmPartners: (partners) => set({ dmPartners: partners }),
    setStaffList: (list) => set({ staffList: list }),
    setOnlineStaff: (ids) => set({ onlineStaffIds: ids }),

    prependMessages: (key, msgs) =>
      set((state) => {
        if (!state.messages[key]) state.messages[key] = [];
        const existingIds = new Set(state.messages[key].map((m) => m.id));
        const uniqueNew = msgs.filter((m) => !existingIds.has(m.id));
        state.messages[key] = [...uniqueNew, ...state.messages[key]];
      }),

    appendMessage: (key, msg) =>
      set((state) => {
        if (!state.messages[key]) state.messages[key] = [];
        // Deduplicate by id
        if (state.messages[key].find((m) => m.id === msg.id)) return;
        // Replace the optimistic (temp-) copy of my own message with the
        // server-confirmed one (same sender + content + attachment).
        const tempIdx = state.messages[key].findIndex(
          (m) =>
            m.id.startsWith("temp-") &&
            m.senderId === msg.senderId &&
            m.content === msg.content &&
            m.attachmentUrl === msg.attachmentUrl
        );
        if (tempIdx >= 0) {
          state.messages[key][tempIdx] = msg;
        } else {
          state.messages[key] = [...state.messages[key], msg];
        }
      }),

    replaceMessage: (key, msg) =>
      set((state) => {
        if (!state.messages[key]) return;
        state.messages[key] = state.messages[key].map((m) =>
          m.id === msg.id ? msg : m
        );
      }),

    removeMessage: (key, messageId) =>
      set((state) => {
        if (!state.messages[key]) return;
        state.messages[key] = state.messages[key].map((m) =>
          m.id === messageId ? { ...m, isDeleted: true } : m
        );
      }),

    // Swap the optimistic temp copy for the server-confirmed message (used when
    // the emit ack arrives before the room broadcast). No-op if the temp is
    // already gone (e.g. the broadcast replaced it first).
    replaceTempMessage: (key, tempId, msg) =>
      set((state) => {
        if (!state.messages[key]) return;
        const idx = state.messages[key].findIndex((m) => m.id === tempId);
        if (idx >= 0) state.messages[key][idx] = msg;
      }),

    // Remove a specific optimistic temp message (e.g. server rejected it).
    removeTempMessage: (key, tempId) =>
      set((state) => {
        if (!state.messages[key]) return;
        state.messages[key] = state.messages[key].filter(
          (m) => m.id !== tempId
        );
      }),

    // Safety net: drop optimistic temp messages the server never confirmed
    // (no ack and no room broadcast) so they don't linger as ghost messages.
    pruneStuckTempMessages: (maxAgeMs = 15000) =>
      set((state) => {
        const cutoff = Date.now() - maxAgeMs;
        for (const key of Object.keys(state.messages)) {
          const next = state.messages[key].filter((m) => {
            if (!m.id.startsWith("temp-")) return true;
            const ts = new Date(m.createdAt).getTime();
            return Number.isNaN(ts) ? true : ts >= cutoff;
          });
          if (next.length !== state.messages[key].length) {
            state.messages[key] = next;
          }
        }
      }),

    setTyping: (key, indicator) =>
      set((state) => {
        if (!state.typing[key]) state.typing[key] = [];
        if (!indicator.isTyping) {
          state.typing[key] = state.typing[key].filter(
            (t) => t.staffId !== indicator.staffId
          );
        } else {
          const existing = state.typing[key].findIndex(
            (t) => t.staffId === indicator.staffId
          );
          if (existing >= 0) {
            state.typing[key][existing] = indicator;
          } else {
            state.typing[key] = [...state.typing[key], indicator];
          }
        }
      }),

    incrementUnread: () =>
      set((state) => {
        state.unreadMentionCount += 1;
      }),

    clearUnread: () => set({ unreadMentionCount: 0 }),

    addPendingMention: (n) =>
      set((state) => {
        state.pendingMentions = [...state.pendingMentions, n];
      }),

    clearPendingMentions: () => set({ pendingMentions: [] }),

    setSurveillanceJoined: (v) => set({ isSurveillanceJoined: v }),

    addSystemNotification: (n) =>
      set((state) => {
        const newNotif: SystemNotification = {
          id: `sn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: n.title,
          body: n.body,
          type: n.type,
          timestamp: new Date(),
          read: false,
        };
        // Keep at most 50 notifications
        const updated = [newNotif, ...state.systemNotifications].slice(0, 50);
        state.systemNotifications = updated;
        state.unreadSystemCount = updated.filter(x => !x.read).length;
      }),

    clearSystemNotifications: () =>
      set({ systemNotifications: [], unreadSystemCount: 0 }),

    markSystemNotificationsRead: () =>
      set((state) => {
        state.systemNotifications = state.systemNotifications.map(n => ({
          ...n,
          read: true,
        }));
        state.unreadSystemCount = 0;
      }),
  }))
);
