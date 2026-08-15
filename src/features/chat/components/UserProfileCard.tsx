// src/features/chat/components/UserProfileCard.tsx
"use client";

import { useState } from "react";
import type { StaffSummary } from "../types/chat.types";
import { useChatStore } from "../store/use-chat-store";
import { Shield, Mail, User } from "lucide-react";

interface Props {
  staff: StaffSummary;
  onStartDm?: () => void;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  customer_support: "Customer Support",
  content_manager: "Content Manager",
  finance: "Finance",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "from-violet-500 to-purple-600",
  admin: "from-blue-500 to-indigo-600",
  customer_support: "from-sky-500 to-cyan-600",
  content_manager: "from-emerald-500 to-teal-600",
  finance: "from-amber-500 to-orange-500",
};

export function UserProfileCard({ staff, onStartDm, children }: Props) {
  const [open, setOpen] = useState(false);
  const onlineStaffIds = useChatStore((s) => s.onlineStaffIds);
  const isOnline = onlineStaffIds.includes(staff.id);

  return (
    <div className="relative inline-block">
      <div
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer"
      >
        {children}
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Card */}
          <div className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Header gradient */}
            <div className={`h-12 bg-gradient-to-r ${ROLE_COLORS[staff.role] ?? "from-slate-500 to-slate-600"}`} />

            {/* Avatar */}
            <div className="px-4 pb-4">
              <div className="relative -mt-6 mb-3">
                {staff.profilePictureURL ? (
                  <img
                    src={staff.profilePictureURL}
                    alt={staff.name ?? ""}
                    className="h-12 w-12 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">
                    {staff.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    isOnline ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              </div>

              <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                {staff.name ?? "—"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Shield className="h-3 w-3" />
                {ROLE_LABELS[staff.role] ?? staff.role}
              </p>

              {staff.email && (
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  {staff.email}
                </p>
              )}

              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isOnline
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {isOnline ? "● Online" : "○ Offline"}
                </span>
              </div>

              {onStartDm && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onStartDm();
                  }}
                  className="mt-3 w-full py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5" />
                  Send Message
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
