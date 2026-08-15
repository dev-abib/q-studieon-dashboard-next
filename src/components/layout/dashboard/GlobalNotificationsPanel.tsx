// src/components/layout/dashboard/GlobalNotificationsPanel.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  ClipboardList,
  MessageSquareQuote,
  AtSign,
  ShieldAlert,
  Zap,
  X,
} from "lucide-react";
import { useChatStore, SystemNotification } from "@/features/chat/store/use-chat-store";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_CONFIG: Record<
  SystemNotification["type"],
  { icon: React.ComponentType<{ className?: string }>; bg: string; iconColor: string; border: string }
> = {
  task: {
    icon: ClipboardList,
    bg: "bg-primary/10",
    iconColor: "text-primary",
    border: "border-primary/20",
  },
  inquiry: {
    icon: MessageSquareQuote,
    bg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    border: "border-blue-500/20",
  },
  mention: {
    icon: AtSign,
    bg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    border: "border-violet-500/20",
  },
  alert: {
    icon: ShieldAlert,
    bg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    border: "border-rose-500/20",
  },
  system: {
    icon: Zap,
    bg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    border: "border-amber-500/20",
  },
};

export function GlobalNotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    systemNotifications,
    unreadSystemCount,
    markSystemNotificationsRead,
    clearSystemNotifications,
  } = useChatStore();

  const handleNotifItemClick = (notif: SystemNotification) => {
    setOpen(false);
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    } else if (notif.type === "task") {
      router.push("/dashboard/tasks");
    } else if (notif.type === "inquiry") {
      router.push("/dashboard/queries");
    } else if (notif.type === "mention" || notif.type === "alert") {
      router.push("/dashboard/team-chat");
    } else {
      router.push("/dashboard");
    }
  };

  // Position the portal panel relative to the bell button
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  // Close on click outside (both button and panel)
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedButton = buttonRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedButton && !clickedPanel) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Mark all as read immediately when panel opens
  useEffect(() => {
    if (open && unreadSystemCount > 0) {
      markSystemNotificationsRead();
    }
  }, [open, unreadSystemCount, markSystemNotificationsRead]);

  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: panelPos.top,
        right: panelPos.right,
        zIndex: 99999,
        width: 380,
        maxWidth: "calc(100vw - 24px)",
      }}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">System Notifications</p>
            <p className="text-[11px] text-slate-400 leading-tight">
              {systemNotifications.length === 0
                ? "No notifications yet"
                : `${systemNotifications.length} notification${systemNotifications.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadSystemCount > 0 && (
            <button
              type="button"
              onClick={() => markSystemNotificationsRead()}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10 flex items-center gap-1 transition-all border border-primary/20"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark read</span>
            </button>
          )}
          {systemNotifications.length > 0 && (
            <button
              type="button"
              onClick={clearSystemNotifications}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              title="Clear all notifications"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-slate-50 dark:divide-slate-800/60">
        {systemNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BellOff className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Task assignments, inquiries, mentions, and security alerts will appear here.
              </p>
            </div>
          </div>
        ) : (
          systemNotifications.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotifItemClick(notif)}
                className={`flex gap-3 items-start px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                  !notif.read ? "bg-primary/[0.03] dark:bg-primary/[0.05]" : ""
                }`}
              >
                {/* Icon */}
                <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center border ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold leading-snug truncate ${notif.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">{timeAgo(notif.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {systemNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={markSystemNotificationsRead}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {/* Bell Button — stays in normal DOM flow inside the header */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        title="System Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadSystemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900">
            {unreadSystemCount > 99 ? "99+" : unreadSystemCount}
          </span>
        )}
      </button>

      {/* Portal — renders OUTSIDE all parent stacking contexts at document.body level */}
      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
