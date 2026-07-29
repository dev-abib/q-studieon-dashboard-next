"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  FileText,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllPages } from "@/features/dynamic-page/hooks/use-get-all-dynamic-pages";

interface DynamicPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  createdAt: string;
}

// ── Skeleton ──
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
      <div className="mb-3 h-5 w-2/3 rounded-lg bg-stone-100" />
      <div className="mb-2 h-3 w-1/3 rounded bg-stone-100" />
      <div className="h-3 w-full rounded bg-stone-100" />
      <div className="mt-3 h-3 w-4/5 rounded bg-stone-100" />
    </div>
  );
}

// ── Page Card ──
function PageCard({ page }: { page: DynamicPage }) {
  const plainText = page.description.replace(/<[^>]+>/g, "").slice(0, 120);

  return (
    <Link
      href={`/page/${page.slug}`}
      className="group block rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 transition-colors group-hover:bg-amber-100">
          <FileText className="h-4.5 w-4.5 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-base font-normal text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {page.title}
          </h2>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-stone-400">
            <Globe className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">/{page.slug}</span>
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-200 transition-colors group-hover:text-amber-400" />
      </div>

      {plainText && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-stone-400">
          {plainText}
        </p>
      )}

      <p className="mt-3 text-[10px] text-stone-300">
        {new Date(page.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
    </Link>
  );
}

export default function PublicPagesListing() {
  const [pg, setPg] = useState(1);
  const limit = 12;
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetAllPages({ page: pg, limit, search, published: true });
  const pages: DynamicPage[] = data?.data?.pages ?? [];
  const meta = data?.data?.meta;

  return (
    <div
      className="min-h-screen bg-stone-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-stone-100 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-800"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {process.env.NEXT_PUBLIC_SITE_NAME || "Home"}
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-widest text-stone-300">
            Pages
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <h1
            className="text-4xl font-normal leading-tight text-stone-800 sm:text-5xl"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Pages
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-stone-400">
            Browse through our collection of pages — from policies to guides,
            everything you need in one place.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="relative mx-auto mt-8 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300" />
          <Input
            value={search}
            placeholder="Search pages…"
            className="h-11 rounded-xl border-stone-200 bg-white pl-11 text-sm text-stone-700 shadow-sm placeholder:text-stone-300 focus-visible:ring-amber-400"
            onChange={(e) => {
              setSearch(e.target.value);
              setPg(1);
            }}
          />
        </div>
      </section>

      {/* ── Grid ── */}
      <main className="mx-auto max-w-5xl px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : pages.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((p) => (
                <PageCard key={p.id} page={p} />
              ))}
            </div>

            {/* ── Pagination ── */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between border-t border-stone-100 pt-6">
                <p className="text-xs text-stone-400">
                  Page{" "}
                  <span className="font-medium text-stone-600">
                    {meta.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-stone-600">
                    {meta.totalPages}
                  </span>
                  &nbsp;·&nbsp;
                  <span className="font-medium text-stone-600">
                    {meta.total}
                  </span>{" "}
                  total
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPrevPage}
                    onClick={() => setPg((p) => p - 1)}
                    className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPg((p) => p + 1)}
                    className="h-8 rounded-lg border-stone-200 text-xs text-stone-600 shadow-none hover:bg-stone-50 disabled:opacity-30"
                  >
                    Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-20">
            <FileText className="mb-3 h-8 w-8 text-stone-200" />
            <p className="text-sm text-stone-400">No pages found</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-100 bg-white py-6 text-center">
        <p className="text-[11px] text-stone-300">
          Powered by{" "}
          <span className="font-medium text-stone-400">
            {process.env.NEXT_PUBLIC_SITE_NAME || "QStudieon"}
          </span>
        </p>
      </footer>
    </div>
  );
}
