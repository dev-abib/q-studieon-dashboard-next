// src/features/chat/hooks/use-chat-socket.ts
"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "../store/use-chat-store";
import type { ChatMessage, TypingIndicator, MentionNotification } from "../types/chat.types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3000";

// When Web Push is configured the service worker is the single source of
// OS-level notifications (they arrive even when the tab is backgrounded). The
// socket handlers then only do in-app UI (toast/panel/sound) to avoid showing
// duplicate OS notifications for the same event.
function webPushEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW Registered successfully]:", reg.scope);
      })
      .catch((err) => {
        console.warn("[SW Registration error]:", err);
      });
  }
}

function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
  window.addEventListener("click", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);
}

function playNotificationSound() {
  if (typeof window === "undefined") return;

  // 1. HTML5 Audio play attempt
  try {
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFb4x+kI2Xmqazt7y/wsfN1ODn6u3u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u");
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {}

  // 2. Web Audio API synthesized tone
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {}
}

function playAlarmSound() {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(987.77, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {}
}

function showPushNotification(
  title: string,
  body: string,
  icon?: string,
  senderId?: string,
  messageId?: string,
  targetUrl: string = "/dashboard/team-chat"
) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  const sendNotification = () => {
    try {
      let absoluteIcon: string | undefined = undefined;
      if (icon && (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("data:"))) {
        absoluteIcon = icon;
      } else if (icon && icon.startsWith("/")) {
        absoluteIcon = window.location.origin + icon;
      }

      console.log("[Notification] Direct OS Notification trigger:", title);
      const notif = new Notification(title, {
        body,
        ...(absoluteIcon ? { icon: absoluteIcon } : {}),
      });

      notif.onclick = () => {
        window.focus();
        if (typeof window !== "undefined" && targetUrl) {
          window.location.href = targetUrl;
        }
        notif.close();
      };
    } catch (err) {
      console.warn("[OS Notification Direct Error]:", err);
    }
  };

  if (Notification.permission === "granted") {
    sendNotification();
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") sendNotification();
      else console.warn("[Notifications] Permission denied by user");
    });
  } else {
    console.warn("[Notifications] Permission denied");
  }
}

// ── Room-key helper ───────────────────────────────────────────────────────────
function dmRoomKey(msg: ChatMessage, currentUserId: string): string {
  const partnerId =
    msg.senderId === currentUserId ? msg.dmPartnerId! : msg.senderId;
  return `dm:${partnerId}`;
}

export function triggerSystemNotification(
  title: string,
  body: string,
  type: "task" | "inquiry" | "mention" | "alert" | "system" = "inquiry",
  targetUrl: string = "/dashboard/queries"
) {
  if (typeof window === "undefined") return;

  const { systemNotifications, addSystemNotification, showToast } = useChatStore.getState();

  const isDuplicate = systemNotifications.some(
    (n) => n.title === title && n.body === body && Date.now() - new Date(n.timestamp).getTime() < 1000
  );
  if (isDuplicate) return;

  addSystemNotification({ title, body, type, targetUrl });
  playNotificationSound();
  showPushNotification(title, body, undefined, undefined, undefined, targetUrl);
  showToast(title, body);
}

export function useChatSocket(
  currentUserId?: string,
  userRole?: string,
  isOwner?: boolean
) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const {
    setSocket,
    setConnected,
    appendMessage,
    replaceMessage,
    removeMessage,
    setOnlineStaff,
    setTyping,
    incrementUnread,
    addPendingMention,
    setSurveillanceJoined,
  } = useChatStore();

  useEffect(() => {
    if (!currentUserId) return;

    registerServiceWorker();
    requestNotificationPermission();

    const socket = io(`${SOCKET_URL}/chat`, {
      withCredentials: true,
      // Polling first: the live reverse proxy (Apache) does not forward
      // WebSocket upgrades to the backend, so a websocket-first connection
      // 400s on the upgrade and never falls back (tryAllTransports is off by
      // default). Long-polling works through the proxy; a failed websocket
      // upgrade probe leaves the polling connection intact.
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;
    setSocket(socket);

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && socket && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const pruneTimer = setInterval(() => {
      useChatStore.getState().pruneStuckTempMessages();
    }, 5000);

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    socket.on("connect", () => {
      setConnected(true);
      const { groups } = useChatStore.getState();
      for (const g of groups) {
        socket.emit("joinGroup", { groupId: g.id });
      }
      if (userRole === "super_admin" || isOwner) {
        socket.emit("joinSurveillance");
        setSurveillanceJoined(true);
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("[Chat] Socket connection error:", err.message);
      setConnected(false);
    });

    socket.on("disconnect", () => setConnected(false));

    // ── Online list ───────────────────────────────────────────────────────────
    socket.on("onlineList", ({ onlineStaffIds }: { onlineStaffIds: string[] }) => {
      setOnlineStaff(onlineStaffIds);
    });

    // ── New message ───────────────────────────────────────────────────────────
    socket.on("newMessage", ({ message }: { message: ChatMessage }) => {
      console.log("[Chat Debug] Received newMessage event. message:", message, "currentUserId:", currentUserId);

      const key = message.groupId
        ? `group:${message.groupId}`
        : dmRoomKey(message, currentUserId ?? "");

      appendMessage(key, message);

      if (message.senderId !== currentUserId) {
        const senderName = message.sender?.name ?? "Someone";
        const snippet =
          message.attachmentUrl && !message.content
            ? `📎 ${message.attachmentName ?? "File"}`
            : message.content.slice(0, 80);

        const notifTitle = message.groupId
          ? `💬 ${senderName} in group`
          : `💬 New message from ${senderName}`;

        const targetUrl = message.groupId
          ? `/dashboard/team-chat`
          : `/dashboard/team-chat`;

        triggerSystemNotification(notifTitle, `"${snippet}"`, message.groupId ? "task" : "inquiry", targetUrl);

        queryClient.invalidateQueries({ queryKey: ["chat", key] });
      }
    });

    // ── Edit / delete ─────────────────────────────────────────────────────────
    socket.on("messageEdited", ({ message }: { message: ChatMessage }) => {
      const key = message.groupId
        ? `group:${message.groupId}`
        : dmRoomKey(message, currentUserId ?? "");
      replaceMessage(key, message);
    });

    socket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
      const { messages } = useChatStore.getState();
      for (const key of Object.keys(messages)) {
        removeMessage(key, messageId);
      }
    });

    // ── Reactions ─────────────────────────────────────────────────────────────
    socket.on(
      "messageReactionUpdated",
      ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
        useChatStore.getState().updateMessageReactions(messageId, reactions);
      }
    );

    // ── Typing ────────────────────────────────────────────────────────────────
    socket.on(
      "typingIndicator",
      (
        indicator: TypingIndicator & { groupId?: string; dmPartnerId?: string }
      ) => {
        const key = indicator.groupId
          ? `group:${indicator.groupId}`
          : `dm:${indicator.staffId}`;
        setTyping(key, indicator);
      }
    );

    // ── Mention notification ──────────────────────────────────────────────────
    socket.on("mentionNotification", (n: MentionNotification) => {
      incrementUnread();
      addPendingMention(n);
      const mentionUrl = "/dashboard/team-chat";
      triggerSystemNotification(`🔔 ${n.senderName} mentioned you`, `"${n.contentSnippet}"`, "mention", mentionUrl);
    });

    // ── Group member updates ───────────────────────────────────────────────
    socket.on("groupMemberAdded", (data: { groupId: string; group?: any; addedStaffId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "groups"] });
      if (data.group) {
        useChatStore.getState().updateGroup(data.group);
      }
    });

    socket.on("groupMemberRemoved", (data: { groupId: string; group?: any; removedStaffId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "groups"] });
      if (data.group) {
        useChatStore.getState().updateGroup(data.group);
      }
    });

    // ── Surveillance notification ─────────────────────────────────────────────
    socket.on(
      "suspiciousMessage",
      (data: {
        messageId: string;
        senderId: string;
        senderEmail: string;
        reason: string;
        roomLabel: string;
      }) => {
        console.log("[Chat Debug] Received suspiciousMessage alert:", data);
        const alertUrl = "/dashboard/team-chat";
        triggerSystemNotification(`⚠️ SUSPICIOUS ACTIVITY DETECTED`, `${data.senderEmail} flagged in ${data.roomLabel} for "${data.reason}"`, "alert", alertUrl);
        queryClient.invalidateQueries({ queryKey: ["chat", "surveillance"] });
      }
    );

    // ── Global System Push Notifications ──────────────────────────────────────
    socket.on(
      "systemNotification",
      (data: { title: string; body: string; type?: string; data?: any; url?: string }) => {
        if (data.data?.targetUserId && String(data.data.targetUserId) !== String(currentUserId)) {
          return;
        }

        console.log("[Global System Notification Received]:", data);

        const notifType = (data.type as any) ??
          (data.title.includes("Task") || data.title.includes("📋") || data.title.includes("📈")
            ? "task"
            : data.title.includes("Inquiry") || data.title.includes("📨")
            ? "inquiry"
            : data.title.includes("Report") || data.title.includes("📄")
            ? "inquiry"
            : data.title.includes("SUSPICIOUS") || data.title.includes("⚠️")
            ? "alert"
            : "system");

        const targetUrl = data.url || data.data?.url || (notifType === "task" ? "/dashboard/tasks" : notifType === "inquiry" ? "/dashboard/queries" : "/dashboard");

        triggerSystemNotification(data.title, data.body, notifType, targetUrl);

        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["contact-queries"] });
      }
    );

    return () => {
      clearInterval(pruneTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [currentUserId]); // re-init if user changes (e.g. impersonation)

  // Keep group room membership in sync whenever the group list loads/updates
  // (the socket may have connected before groups were fetched).
  const groups = useChatStore((s) => s.groups);
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    for (const g of groups) {
      s.emit("joinGroup", { groupId: g.id });
    }
  }, [groups]);

  return socketRef.current;
}
