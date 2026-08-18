"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ThemedBackdrop from "@/components/ThemedBackdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      <ThemedBackdrop overlay="auth" interactive />

      <div className="relative hidden w-1/2 overflow-hidden border-r border-slate-200 dark:border-white/10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm dark:bg-black/30" />
        <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-20 right-10 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

        <div className="relative flex items-center justify-between px-10 pt-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-ink-900 dark:text-white">
              Easy<span className="text-cyan-600 dark:text-cyan-300">Circular</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-white/5">
            <svg className="h-10 w-10 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black leading-tight text-ink-900 dark:text-white">
            Turn circulars into <br />
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-cyan-300 dark:to-blue-400">
              clear insights
            </span>
          </h2>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-ink-600 dark:text-slate-300">
            AI-powered summaries, entity highlighting, and human review, all in one workflow.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {["Smart OCR", "NER Highlights", "AI Summaries", "Human Review"].map((feat) => (
              <span
                key={feat}
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-ink-700 backdrop-blur-sm dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
              >
                {feat}
              </span>
            ))}
          </div>

          <div className="mt-10 max-w-sm rounded-2xl border border-slate-200 bg-white/70 p-5 text-left backdrop-blur-xl dark:border-white/10 dark:bg-black/30">
            <p className="text-sm font-medium leading-relaxed text-ink-700 dark:text-slate-200">
              &ldquo;This tool saves us hours every time a new circular arrives from the ministry.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-ink-500 dark:text-slate-400">
              School Principal, Western Province
            </p>
          </div>
        </div>

        <div className="relative px-10 pb-8">
          <p className="text-xs font-medium text-ink-400 dark:text-slate-500">
            University of Bedfordshire · Y3 Dissertation · Phase 4
          </p>
        </div>
      </div>

      <div className="relative flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5 group lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-ink-900 dark:text-white">
              Easy<span className="text-cyan-600 dark:text-cyan-300">Circular</span>
            </span>
          </Link>
          <div className="ml-auto lg:hidden">
            <ThemeToggle compact />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-up">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/40 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
