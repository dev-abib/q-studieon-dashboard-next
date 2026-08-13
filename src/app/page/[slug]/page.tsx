"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, CalendarDays } from "lucide-react";
import { useGetPageBySlug } from "@/features/dynamic-page/hooks/use-get-page-by-slug";

export default function PublicDynamicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const { data, isLoading, error } = useGetPageBySlug(slug);
  const page = data?.data?.page;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfaf7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <p className="text-sm text-stone-400">Loading page…</p>
        </div>
      </div>
    );
  }

  // ── Error / Not found ──
  if (error || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfaf7] px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <FileText className="h-6 w-6 text-rose-400" />
        </div>
        <h1
          className="mt-4 text-2xl font-normal text-stone-800"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Page not found
        </h1>
        <p className="mt-1.5 text-sm text-stone-400">
          The page at{" "}
          <span className="font-mono text-xs text-stone-500">/{slug}</span>{" "}
          doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-6 flex items-center gap-1.5 text-xs text-amber-600 transition-colors hover:text-amber-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    );
  }

  // Strip HTML for the "no content" fallback check
  const plainText = page.description.replace(/<[^>]+>/g, "").trim();

  const publishedDate = new Date(page.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#fbfaf7]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Ambient amber glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(55%_100%_at_50%_0%,rgba(251,191,36,0.14),transparent_70%)]"
      />

      <main className="relative mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        {/* ── Brand row ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 font-serif text-lg font-bold text-white shadow-md shadow-amber-500/25">
              Q
            </div>
            <span className="text-sm font-semibold tracking-tight text-stone-800">
              QStudieon
            </span>
          </div>
          <span className="hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-stone-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Public docs
          </span>
        </div>

        {/* ── Hero ── */}
        <header className="mt-12 rounded-3xl border border-amber-100/70 bg-gradient-to-br from-amber-50/80 via-white to-stone-50 p-8 shadow-[0_2px_24px_-10px_rgba(245,158,11,0.25)] sm:p-12">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
              {publishedDate}
            </span>
            <span className="text-stone-300">·</span>
            <span className="font-mono text-stone-400">/{page.slug}</span>
          </div>

          <h1
            className="mt-5 text-4xl font-normal leading-[1.1] tracking-tight text-stone-900 sm:text-[3.5rem]"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {page.title}
          </h1>

          <div className="mt-8 h-px w-full bg-gradient-to-r from-amber-300/70 via-amber-200/40 to-transparent" />
        </header>

        {/* ── Rendered HTML content — authored by admins via the rich editor,
            not end-users, so dangerouslySetInnerHTML is acceptable. ── */}
        <div className="mt-12">
          {plainText ? (
            <div
              className="rich-content rich-content-lg"
              dangerouslySetInnerHTML={{ __html: page.description }}
            />
          ) : (
            <p className="text-base italic text-stone-300">
              This page has no content yet.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="mt-16 flex items-center justify-between border-t border-stone-200/70 pt-8">
          <p className="text-xs text-stone-400">
            Published by{" "}
            <span className="font-medium text-stone-500">
              {process.env.NEXT_PUBLIC_SITE_NAME || "QStudieon"}
            </span>
          </p>
          <Link
            href="/"
            className="text-xs text-amber-600 transition-colors hover:text-amber-700 hover:underline"
          >
            Home →
          </Link>
        </footer>
      </main>
    </div>
  );
}
