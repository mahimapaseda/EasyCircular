"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { WORKFLOW_STEPS } from "@/lib/contracts";
import { formatRelativeTime, wordCount } from "@/components/workspace/workspaceUtils";
import type { Circular } from "@/lib/circulars";

type WorkflowLayoutProps = {
  circular: Circular;
  currentStep: number;
  children: ReactNode;
  actions?: ReactNode;
};

export default function WorkflowLayout({
  circular,
  currentStep,
  children,
  actions,
}: WorkflowLayoutProps) {
  const words = wordCount(circular);
  const clamped = Math.min(Math.max(currentStep, 1), WORKFLOW_STEPS.length);

  const stats = [
    circular.processingMeta.pageCount > 0 && `${circular.processingMeta.pageCount} pages`,
    words > 0 && `${words.toLocaleString()} words`,
    circular.entities.length > 0 && `${circular.entities.length} entities`,
    circular.processingMeta.ocrUsed && (circular.processingMeta.ocrLang || "OCR"),
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-ink-200/80 bg-white/95 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/95">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1.5 text-xs text-ink-400">
              <Link href="/circulars" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Documents
              </Link>
              <span>/</span>
              <span className="truncate">{circular.originalFilename}</span>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-ink-900 dark:text-white sm:text-xl">
                {circular.originalFilename}
              </h1>
              <StatusBadge status={circular.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-400">
              <span>Updated {formatRelativeTime(circular.updatedAt)}</span>
              {stats.length > 0 && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span>{stats.join(" · ")}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-ink-100 px-4 py-2 sm:px-6 dark:border-ink-800">
          {WORKFLOW_STEPS.map((step) => {
            const done = clamped > step.id;
            const active = clamped === step.id;
            return (
              <span
                key={step.key}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  active
                    ? "bg-brand-600 text-white"
                    : done
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                      : "bg-slate-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500"
                }`}
              >
                {done && !active && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.label}
              </span>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
