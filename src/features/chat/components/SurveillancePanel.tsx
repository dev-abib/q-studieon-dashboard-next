// src/features/chat/components/SurveillancePanel.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/chat.api";
import type { ChatMessage } from "../types/chat.types";
import {
  ShieldAlert,
  Search,
  Flag,
  AlertTriangle,
  Check,
  Hash,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SurveillanceMessage extends ChatMessage {
  group?: { id: string; name: string } | null;
}

export function SurveillancePanel() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [filterAutoFlagged, setFilterAutoFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState<Record<string, string>>({});
  const [flagging, setFlagging] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat", "surveillance", page, search, filterFlagged, filterAutoFlagged],
    queryFn: () =>
      chatApi.getSurveillance({
        page,
        search: search || undefined,
        isFlagged: filterFlagged || undefined,
        isAutoFlagged: filterAutoFlagged || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      chatApi.flagMessage(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "surveillance"] });
      setFlagging(null);
    },
  });

  const messages: SurveillanceMessage[] = data?.messages ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 30);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Message Surveillance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {total.toLocaleString()} messages
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search messages…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          <FilterChip
            label="Manually Flagged"
            icon={<Flag className="h-3 w-3" />}
            active={filterFlagged}
            color="orange"
            onClick={() => { setFilterFlagged((v) => !v); setPage(1); }}
          />
          <FilterChip
            label="Auto-Flagged"
            icon={<AlertTriangle className="h-3 w-3" />}
            active={filterAutoFlagged}
            color="red"
            onClick={() => { setFilterAutoFlagged((v) => !v); setPage(1); }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
            <ShieldAlert className="h-8 w-8 opacity-30" />
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 ${
                  msg.isFlagged
                    ? "bg-orange-50 dark:bg-orange-900/10"
                    : msg.isAutoFlagged
                    ? "bg-red-50 dark:bg-red-900/10"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Sender avatar */}
                  <div className="shrink-0">
                    {msg.sender.profilePictureURL ? (
                      <img
                        src={msg.sender.profilePictureURL}
                        className="h-8 w-8 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                        {msg.sender.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {msg.sender.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      {msg.group && (
                        <span className="text-[10px] flex items-center gap-0.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                          <Hash className="h-2.5 w-2.5" />
                          {msg.group.name}
                        </span>
                      )}
                      {msg.dmPartnerId && (
                        <span className="text-[10px] flex items-center gap-0.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                          <User className="h-2.5 w-2.5" />
                          DM
                        </span>
                      )}
                      {msg.isFlagged && (
                        <span className="text-[10px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Flag className="h-2.5 w-2.5" />
                          Flagged
                        </span>
                      )}
                      {msg.isAutoFlagged && (
                        <span className="text-[10px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Auto-flagged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                      {msg.content}
                    </p>
                    {msg.autoFlagReason && (
                      <p className="mt-1 text-xs text-red-500 italic">{msg.autoFlagReason}</p>
                    )}
                    {msg.flagReason && (
                      <p className="mt-1 text-xs text-orange-500 italic">Reason: {msg.flagReason}</p>
                    )}

                    {/* Flag action */}
                    {!msg.isFlagged && (
                      <div className="mt-2">
                        {flagging === msg.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={flagReason[msg.id] ?? ""}
                              onChange={(e) =>
                                setFlagReason((p) => ({ ...p, [msg.id]: e.target.value }))
                              }
                              placeholder="Flag reason…"
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setFlagging(null);
                              }}
                              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40 flex-1"
                            />
                            <button
                              onClick={() => {
                                const reason = flagReason[msg.id];
                                if (reason?.trim()) {
                                  flagMutation.mutate({ id: msg.id, reason: reason.trim() });
                                }
                              }}
                              disabled={!flagReason[msg.id]?.trim()}
                              className="text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Flag
                            </button>
                            <button
                              onClick={() => setFlagging(null)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setFlagging(msg.id)}
                            className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                          >
                            <Flag className="h-3 w-3" />
                            Flag this message
                          </button>
                        )}
                      </div>
                    )}
                    {msg.isFlagged && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3 w-3" />
                        Flagged
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  color,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700",
    red: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-700",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
        active
          ? colorMap[color]
          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
