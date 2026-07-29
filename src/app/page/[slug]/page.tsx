"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Globe } from "lucide-react";
import { useGetPageBySlug } from "@/features/dynamic-page/hooks/use-get-page-by-slug";

export default function PublicDynamicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const { data, isLoading, error } = useGetPageBySlug(slug);
  const page = data?.data?.page;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
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

  // Strip HTML for meta description or fallback
  const plainText = page.description.replace(/<[^>]+>/g, "").slice(0, 160);

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Nav bar ── */}
      <header className="sticky top-0 z-10 border-b border-stone-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-stone-300">
            <Globe className="h-3 w-3" />
            Public Page
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <article className="rounded-2xl border border-stone-100 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
          {/* Title */}
          <h1
            className="text-3xl font-normal leading-tight text-stone-800 sm:text-4xl"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {page.title}
          </h1>

          {/* Slug + meta */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-stone-50 px-3 py-1 font-mono text-[11px] text-stone-400">
              /{page.slug}
            </span>
            <span className="text-[11px] text-stone-300">
              {new Date(page.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-stone-100" />

          {/* Rendered HTML content */}
          {plainText ? (
            <div
              className="prose prose-sm max-w-none text-stone-700 prose-headings:font-normal prose-headings:text-stone-800 prose-headings:font-['DM_Serif_Display'] prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-strong:text-stone-700"
              dangerouslySetInnerHTML={{ __html: page.description }}
            />
          ) : (
            <p className="text-sm italic text-stone-300">
              This page has no content yet.
            </p>
          )}
        </article>

        {/* ── Footer ── */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] text-stone-300">
            Powered by{" "}
            <span className="font-medium text-stone-400">
              {process.env.NEXT_PUBLIC_SITE_NAME || "QStudieon"}
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}
