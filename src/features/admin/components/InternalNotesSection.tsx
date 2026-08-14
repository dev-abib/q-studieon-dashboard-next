"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Pin,
  Trash2,
  Send,
  Loader2,
  Lock,
  UserCheck,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternalNotes } from "../hooks/use-internal-notes";

export function InternalNotesSection({
  targetType,
  targetId,
  title,
}: {
  targetType: "User" | "ContactQuery";
  targetId: string;
  title?: string;
}) {
  const [content, setContent] = useState("");
  const { notes, isLoading, createNote, isCreating, togglePin, deleteNote } =
    useInternalNotes(targetType, targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createNote(content.trim(), {
      onSuccess: () => setContent(""),
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title || "Private Internal Staff Notes"}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Staff Only
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Visible only to administrative staff. The user cannot see these notes.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          placeholder="Add an internal note, customer phone call summary, or moderation note..."
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          rows={2}
          className="w-full text-xs rounded-2xl p-3 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-hidden resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!content.trim() || isCreating}
            size="sm"
            className="rounded-xl h-8 px-4 text-xs font-bold gap-1.5"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Add Note</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-2.5 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-6 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading notes...
          </div>
        ) : notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-3.5 rounded-2xl border transition-colors ${
                note.isPinned
                  ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10"
                  : "bg-slate-50/70 dark:bg-slate-850/50 border-slate-200/70 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {note.authorName || "Staff"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold capitalize">
                    ({note.authorRole?.replace("_", " ") || "Admin"})
                  </span>
                  {note.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <Pin className="h-3 w-3 fill-amber-500" />
                      Pinned
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => togglePin(note.id)}
                    title={note.isPinned ? "Unpin note" : "Pin note to top"}
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    title="Delete note"
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>

              <div className="text-[10px] text-slate-400 mt-2">
                {new Date(note.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No internal staff notes on this record yet.
          </div>
        )}
      </div>
    </div>
  );
}
