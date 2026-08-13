"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, ArrowLeft } from "lucide-react";
import { useGetPageBySlug } from "@/features/dynamic-page/hooks/use-get-page-by-slug";

export default function PublicDynamicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const { data, isLoading, error } = useGetPageBySlug(slug);
  const page = data?.data?.page;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading page…</span>
        </div>
      </div>
    );
  }

  // ── Error / Not found ──
  if (error || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          The requested page <span className="font-mono font-semibold">/{slug}</span> could not be found or has been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>
    );
  }

  const plainText = page.description?.replace(/<[^>]+>/g, "").trim() ?? "";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20 selection:text-primary">
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug mb-6 sm:mb-8">
          {page.title}
        </h1>

        {/* Page Content */}
        {plainText ? (
          <div
            className="rich-content rich-content-lg font-sans text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.description }}
          />
        ) : (
          <p className="text-sm italic text-slate-400">
            This page has no content yet.
          </p>
        )}
      </main>
    </div>
  );
}
