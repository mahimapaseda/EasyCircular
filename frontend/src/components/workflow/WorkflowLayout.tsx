"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import WorkflowSlider from "@/components/workflow/WorkflowSlider";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { formatRelativeTime, wordCount } from "@/components/workspace/workspaceUtils";
import type { Circular } from "@/lib/circulars";

type WorkflowLayoutProps = {
  circular: Circular;
  currentStep: number;
  children: ReactNode;
};

export default function WorkflowLayout({
  circular,
  currentStep,
  children,
}: WorkflowLayoutProps) {
  const words = wordCount(circular);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-ink-200/80 bg-white dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-end px-4 pt-3 sm:px-6">
          <ThemeToggle />
        </div>
        <div className="px-4 pb-5 pt-2 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <nav className="flex items-center gap-1.5 text-xs text-ink-400">
                  <Link href="/circulars" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    Documents
                  </Link>
                  <span>/</span>
                  <span className="truncate font-medium text-ink-600 dark:text-ink-400">
                    {circular.originalFilename}
                  </span>
                </nav>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-2xl">
                  {circular.originalFilename}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={circular.status} />
                  <span className="text-xs text-ink-400">
                    Updated {formatRelativeTime(circular.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Pages", value: circular.processingMeta.pageCount || "—" },
                { label: "Words", value: words > 0 ? words.toLocaleString() : "—" },
                { label: "Entities", value: circular.entities.length || "—" },
                {
                  label: "OCR",
                  value: circular.processingMeta.ocrUsed
                    ? circular.processingMeta.ocrLang || "Yes"
                    : circular.processingMeta.pageCount > 0
                      ? "No"
                      : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="ws-stat">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{label}</dt>
                  <dd className="mt-0.5 text-sm font-bold text-ink-800 dark:text-ink-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-5">
            <WorkflowSlider currentStep={currentStep} orientation="horizontal" />
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
