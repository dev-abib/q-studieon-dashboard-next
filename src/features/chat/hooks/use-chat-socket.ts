// src/features/chat/hooks/use-chat-socket.ts
"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "../store/use-chat-store";
import type { ChatMessage, TypingIndicator, MentionNotification } from "../types/chat.types";
import { useQueryClient } from "@tanstack/react-query";

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

// ── Notification helpers ──────────────────────────────────────────────────────
function requestNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.12);
    
    // Second tone (A5) after 100ms
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.18);
      } catch {
        // ignore Context closed
      }
    }, 90);
  } catch (err) {
    // browser autoplay blocks
  }
}

function playAlarmSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playBeep = (freq: number, delay: number, duration: number) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        } catch {}
      }, delay);
    };

    playBeep(987.77, 0, 0.15); // B5 tone
    playBeep(987.77, 180, 0.15); // B5 tone repeat
  } catch (err) {}
}

function showPushNotification(
  title: string,
  body: string,
  icon?: string,
  senderId?: string,
  messageId?: string
) {
  if (typeof window === "undefined") return;
  if (typeof window !== "undefined" && !window.isSecureContext) {
    console.warn(
      "[Notifications Debug] Site is running in an INSECURE context (HTTP). Chrome/Edge security policies block Web Push and system notifications on insecure origins. Please access via localhost or HTTPS."
    );
  }
  if (!("Notification" in window)) {
    console.warn("[Notifications] Not supported in this browser");
    return;
  }
  if (Notification.permission !== "granted") {
    console.warn("[Notifications] Permission not granted");
    return;
  }

  // ▸ Resolve absolute URL to prevent browser dropping notifications in background tabs
  let absoluteIcon = "";
  try {
    absoluteIcon = new URL(icon || "/favicon.ico", window.location.origin).href;
  } catch {
    absoluteIcon = "";
  }

  const payload = {
    title,
    body,
    icon: absoluteIcon,
    tag: `chat-msg-${messageId || Date.now()}`,
    senderId,
    url: `/dashboard/team-chat`,
  };

  try {
    if ("serviceWorker" in navigator) {
      console.log("[SW] Triggering background notification via registration");
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, {
            body: payload.body,
            icon: payload.icon,
            badge: payload.icon,
            tag: payload.tag,
            renotify: true,
            data: { url: payload.url },
          } as any);
        })
        .catch((err) => {
          console.warn("[SW] Ready promise failed, falling back to direct notification:", err);
          const notif = new Notification(title, {
            body: payload.body,
            icon: payload.icon,
            badge: payload.icon,
            tag: payload.tag,
            renotify: true,
          } as any);
          setTimeout(() => notif.close(), 5000);
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        });
    } else {
      console.log("[Notification] Direct fallback");
      const notif = new Notification(title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.icon,
        tag: payload.tag,
        renotify: true,
      } as any);

      // Auto-close after 5s
      setTimeout(() => notif.close(), 5000);

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  } catch (err) {
    console.error("[Notification] Failed to display:", err);
  }
}

// ── Room-key helper ───────────────────────────────────────────────────────────
// For a DM message, the "partner" from the current user's perspective is:
//   - The sender (if someone else sent it)
//   - The dmPartnerId (if I sent it)
//   - The currentUserId (if I sent it to myself, fallback)
function dmRoomKey(msg: ChatMessage, currentUserId: string): string {
  const partnerId =
    msg.senderId === currentUserId ? msg.dmPartnerId! : msg.senderId;
  return `dm:${partnerId}`;
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
    showToast,
    addSystemNotification,
  } = useChatStore();

  useEffect(() => {
    if (!currentUserId) return;

    // Request browser notification permission on mount
    requestNotificationPermission();

    const socket = io(`${SOCKET_URL}/chat`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
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

    // ── Optimistic-message safety net ─────────────────────────────────────────
    // If the server never acknowledges a send and never broadcasts the echo
    // (socket died mid-send, handler threw, etc.), remove the stuck temp
    // message after a grace period so it doesn't linger as a ghost.
    const pruneTimer = setInterval(() => {
      useChatStore.getState().pruneStuckTempMessages();
    }, 5000);

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    socket.on("connect", () => {
      setConnected(true);
      // Re-join all group rooms. socket.io clears every room on the server when
      // a socket drops, so on (re)connect we must re-emit joinGroup for each
      // group we belong to — otherwise real-time group messages stop arriving.
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

      // ▸ FIX: compute room key correctly for both sender and recipient
      const key = message.groupId
        ? `group:${message.groupId}`
        : dmRoomKey(message, currentUserId ?? "");

      appendMessage(key, message);

      // Play alert sound & show browser push notification if sender is someone else
      if (message.senderId !== currentUserId) {
        const { activeConversation } = useChatStore.getState();
        const isCurrentActive =
          activeConversation &&
          ((message.groupId &&
            activeConversation.type === "group" &&
            activeConversation.id === message.groupId) ||
            (!message.groupId &&
              activeConversation.type === "dm" &&
              activeConversation.id === message.senderId));

        const isWindowFocused = typeof document !== "undefined" && document.hasFocus();
        if (!isWindowFocused || !isCurrentActive) {
          playNotificationSound();
          
          const senderName = message.sender?.name ?? "Someone";
          const snippet =
            message.attachmentUrl && !message.content
              ? `📎 ${message.attachmentName ?? "File"}`
              : message.content.slice(0, 80);
          if (!webPushEnabled()) {
            showPushNotification(
              `💬 ${senderName}`,
              snippet,
              message.sender?.profilePictureURL ?? undefined,
              message.senderId,
              message.id
            );
          }
          showToast(`💬 ${senderName}`, snippet);
        }
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
      // Scan all rooms since we don't know which
      const { messages } = useChatStore.getState();
      for (const key of Object.keys(messages)) {
        removeMessage(key, messageId);
      }
    });

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
      addSystemNotification({ title: `🔔 ${n.senderName} mentioned you`, body: `"${n.contentSnippet}"`, type: "mention" });
      playNotificationSound();
      if (!webPushEnabled()) {
        showPushNotification(
          `🔔 ${n.senderName} mentioned you`,
          `"${n.contentSnippet}"`,
          undefined,
          n.dmPartnerId || undefined,
          n.messageId
        );
      }
      showToast(`🔔 ${n.senderName} mentioned you`, `"${n.contentSnippet}"`);
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
        addSystemNotification({
          title: `⚠️ Suspicious Activity Detected`,
          body: `${data.senderEmail} flagged in ${data.roomLabel} for "${data.reason}"`,
          type: "alert",
        });
        playAlarmSound();
        if (!webPushEnabled()) {
          showPushNotification(
            `⚠️ SUSPICIOUS ACTIVITY DETECTED`,
            `${data.senderEmail} flagged in ${data.roomLabel} for "${data.reason}"`,
            "/favicon.ico",
            data.senderId,
            data.messageId
          );
        }
        showToast(
          `🚨 Suspicious Activity Detected`,
          `${data.senderEmail} flagged in ${data.roomLabel}. Reason: ${data.reason}`
        );
        queryClient.invalidateQueries({ queryKey: ["chat", "surveillance"] });
      }
    );

    // ── Global System Push Notifications ──────────────────────────────────────
    socket.on(
      "systemNotification",
      (data: { title: string; body: string; type?: string; data?: any }) => {
        console.log("[Global System Notification Received]:", data);
        // Detect notification type from title/type for icon mapping
        const notifType = data.type as any ??
          (data.title.includes("Task") || data.title.includes("📋") || data.title.includes("📈")
            ? "task"
            : data.title.includes("Inquiry") || data.title.includes("📨")
            ? "inquiry"
            : data.title.includes("SUSPICIOUS") || data.title.includes("⚠️")
            ? "alert"
            : "system");

        addSystemNotification({ title: data.title, body: data.body, type: notifType });
        playNotificationSound();
        if (!webPushEnabled()) {
          showPushNotification(data.title, data.body);
        }
        showToast(data.title, data.body);
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
