"use client";

import type { ReactNode } from "react";
import WorkflowSlider from "@/components/workflow/WorkflowSlider";
import StatusBadge from "@/components/ui/StatusBadge";
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
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="space-y-6">
          {/* Document info card */}
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-panel dark:border-ink-800 dark:bg-ink-900">
            <div className="border-b border-ink-200 p-5 dark:border-ink-800">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    Workspace
                  </p>
                  <h2 className="break-words text-sm font-bold leading-tight text-ink-900 dark:text-white">
                    {circular.originalFilename}
                  </h2>
                  <div className="mt-2.5">
                    <StatusBadge status={circular.status} />
                  </div>
                </div>
              </div>
            </div>

            {circular.processingMeta.pageCount > 0 && (
              <div className="p-5">
                <dl className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pages", value: circular.processingMeta.pageCount.toString() },
                    ...(circular.processingMeta.ocrUsed
                      ? [{ label: "OCR", value: circular.processingMeta.ocrLang || "enabled" }]
                      : []),
                    ...(circular.processingMeta.model && circular.status === "completed"
                      ? [{ label: "Model", value: circular.processingMeta.model }]
                      : []),
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="col-span-1 rounded-lg border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-950/50"
                    >
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</dt>
                      <dd className="mt-1 truncate text-xs font-bold text-ink-800 dark:text-ink-200">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Workflow slider (desktop) */}
          <div className="hidden xl:block overflow-hidden rounded-xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-400 dark:text-ink-500">
                Workflow Status
              </h3>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                {Math.min(Math.max(currentStep, 1), 4)} / 4
              </span>
            </div>
            <WorkflowSlider currentStep={currentStep} orientation="vertical" />
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* Horizontal slider (mobile) */}
          <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-panel xl:hidden dark:border-ink-800 dark:bg-ink-900">
            <WorkflowSlider currentStep={currentStep} orientation="horizontal" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
