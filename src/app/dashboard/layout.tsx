"use client";
import { Header } from "@/components/layout/dashboard/Header";
import { Sidebar } from "@/components/layout/dashboard/Sidebar";
import { Admin } from "@/features/admin/types/admin.types";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { adminSchema } from "@/features/auth/schema/admin.schema";

import { useEffect, useState } from "react";
import { ImpersonationBanner } from "@/components/layout/dashboard/ImpersonationBanner";
import { useTeamPresence } from "@/features/admin/hooks/use-team-presence";
import { useChatSocket } from "@/features/chat/hooks/use-chat-socket";
import { usePushSubscription } from "@/features/push/hooks/use-push-subscription";
import { useChatStore } from "@/features/chat/store/use-chat-store";
import { MessageSquare, X, ShieldAlert } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Global team presence and activity heartbeat
  useTeamPresence();

  const { data, isLoading } = useCurrentUser();

  const admin: Admin | null =
    !isLoading && data?.data ? adminSchema.parse(data.data) : null;

  // Global chat socket connection to receive background notifications and updates
  useChatSocket(admin?.id, admin?.role, admin?.isOwner);

  // OS-level Web Push registration — delivers notifications even when the tab
  // is backgrounded or the user is in another app
  usePushSubscription(admin?.id);

  const { toast, hideToast } = useChatStore();
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        setNotificationPermission(perm);
      });
    }
  };

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  // Register service worker for background notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✅ Chat Service Worker registered scope:", reg.scope);
        })
        .catch((err) => {
          console.error("❌ Chat Service Worker registration failed:", err);
        });
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <ImpersonationBanner />

      {/* Global Desktop Notification Banner */}
      {notificationPermission === "default" && (
        <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20 px-6 py-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 shrink-0 z-50">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Enable desktop notifications to receive real-time system alerts and sounds when using other apps.
          </p>
          <button
            onClick={enableNotifications}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {notificationPermission === "denied" && (
        <div className="bg-red-500/10 dark:bg-red-950/20 border-b border-red-500/20 px-6 py-2.5 flex items-center gap-2.5 text-xs text-red-650 dark:text-red-400 shrink-0 z-50">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
          <p className="font-medium flex-1">
            System notifications are blocked by your browser. Please click the 🔒 lock/settings icon in your browser address bar and set Notifications to <b>Allow</b> to see alerts outside the browser.
          </p>
        </div>
      )}
      
      {/* Global In-App Toast Notification Alert */}
      {toast?.visible && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {toast.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.body}
            </p>
          </div>
          <button
            onClick={hideToast}
            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0 self-start transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden bg-slate-50/70 dark:bg-slate-950 p-4 lg:p-6 gap-6">
        <Sidebar role={admin?.role ?? null} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {admin && <Header admin={admin} />}
          <main className="flex-1 overflow-y-auto rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-100/80 dark:border-slate-800/80 p-6 backdrop-blur-sm shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
