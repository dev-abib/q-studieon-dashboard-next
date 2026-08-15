// src/features/chat/components/GroupManageModal.tsx
"use client";

import { useState } from "react";
import type { ChatGroup, StaffSummary } from "../types/chat.types";
import { X, Plus, Trash2, Users, Hash } from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316",
];

interface CreateProps {
  mode: "create";
  staffList: StaffSummary[];
  onConfirm: (payload: { name: string; description?: string; avatarColor: string; memberIds: string[] }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface EditProps {
  mode: "edit";
  group: ChatGroup;
  staffList: StaffSummary[];
  onConfirm: (payload: { name?: string; description?: string; avatarColor?: string; memberIds?: string[] }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

type Props = CreateProps | EditProps;

export function GroupManageModal(props: Props) {
  const isEdit = props.mode === "edit";
  const existing = isEdit ? (props as EditProps).group : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [color, setColor] = useState(existing?.avatarColor ?? AVATAR_COLORS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    existing?.members.map((m) => m.staffId).filter((id) => id !== existing?.createdById) ?? []
  );
  const [search, setSearch] = useState("");

  const filtered = props.staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    props.onConfirm({
      name: name.trim(),
      description: description.trim() || undefined,
      avatarColor: color,
      memberIds: selectedIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Hash className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Edit Group" : "Create Group"}
            </h2>
          </div>
          <button
            onClick={props.onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-lg transition-all ${
                    c === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dev Team"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Members */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Members ({selectedIds.length} selected)
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {filtered.map((s) => {
                const selected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleMember(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all ${
                      selected
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {s.profilePictureURL ? (
                      <img src={s.profilePictureURL} className="h-6 w-6 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 font-medium truncate">{s.name}</span>
                    <div
                      className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected && (
                        <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-current">
                          <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={props.onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || props.isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {props.isLoading ? "Saving…" : isEdit ? "Save Changes" : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
