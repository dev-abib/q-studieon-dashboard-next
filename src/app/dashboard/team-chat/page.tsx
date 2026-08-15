"use client";

import { useState, useEffect } from "react";
import { useChatGroups } from "@/features/chat/hooks/use-chat-groups";
import { useStaffList, useDmThreads } from "@/features/chat/hooks/use-chat-messages";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { SurveillancePanel } from "@/features/chat/components/SurveillancePanel";
import { useChatStore } from "@/features/chat/store/use-chat-store";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { adminSchema } from "@/features/auth/schema/admin.schema";
import type { StaffSummary, ActiveConversation } from "@/features/chat/types/chat.types";
import {
  MessagesSquare,
  MessageSquare,
  ShieldAlert,
  Wifi,
  WifiOff,
  Users,
} from "lucide-react";

export default function TeamChatPage() {
  const { data, isLoading: userLoading } = useCurrentUser();
  const admin = !userLoading && data?.data ? adminSchema.parse(data.data) : null;
  const isSuperAdmin = admin?.role === "super_admin" || !!admin?.isOwner;



  // Load data
  useChatGroups();
  useStaffList();
  useDmThreads();

  const { activeConversation, setActiveConversation, isConnected, onlineStaffIds } =
    useChatStore();

  const [activeTab, setActiveTab] = useState<"chat" | "surveillance">("chat");

  const handleStartDm = (partner: StaffSummary) => {
    setActiveConversation({
      type: "dm",
      id: partner.id,
      label: partner.name ?? partner.email ?? "DM",
    });
    setActiveTab("chat");
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-0 -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            Team Chat
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Online count */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" />
            <span>{onlineStaffIds.length} online</span>
          </div>

          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              isConnected
                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                : "text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {isConnected ? "Live" : "Connecting…"}
          </div>

          {/* Super admin tab switcher */}
          {isSuperAdmin && (
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "chat"
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab("surveillance")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "surveillance"
                    ? "bg-red-500 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Surveillance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — always visible */}
        <ChatSidebar
          currentUserId={admin?.id ?? ""}
          currentUserRole={admin?.role ?? "admin"}
          isOwner={admin?.isOwner}
        />

        {/* Right panel */}
        {activeTab === "surveillance" && isSuperAdmin ? (
          <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
            <SurveillancePanel />
          </div>
        ) : activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUserId={admin?.id ?? ""}
            currentUserRole={admin?.role ?? "admin"}
            isOwner={admin?.isOwner}
            onStartDm={handleStartDm}
          />
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 text-slate-400">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-600 dark:text-slate-300">
                Select a conversation
              </p>
              <p className="text-sm mt-1">
                Choose a channel or teammate to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
