"use client";

import type { ReactNode } from "react";
import WorkflowStepper from "@/components/workflow/WorkflowStepper";
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
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="space-y-4">
        {/* Document info card */}
        <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-b from-brand-50/60 to-white shadow-panel dark:border-ink-800 dark:from-brand-950/20 dark:to-ink-900">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-brand-500 to-fuchsia-600 px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
              Document
            </p>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-fuchsia-100 dark:from-brand-950/50 dark:to-fuchsia-950/30">
                <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-sm font-black leading-tight text-ink-900 dark:text-white">
                  {circular.originalFilename}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={circular.status} />
                </div>
              </div>
            </div>

            {circular.processingMeta.pageCount > 0 && (
              <dl className="mt-4 space-y-2">
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
                    className="flex items-center justify-between gap-2 rounded-lg bg-brand-50/60 px-3 py-1.5 dark:bg-ink-800/40"
                  >
                    <dt className="text-xs font-semibold text-ink-500 dark:text-ink-400">{label}</dt>
                    <dd className="truncate text-xs font-bold text-ink-800 dark:text-ink-200">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Vertical stepper (desktop) */}
        <div className="hidden lg:block">
          <WorkflowStepper currentStep={currentStep} orientation="vertical" />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="min-w-0 space-y-6">
        {/* Horizontal stepper (mobile) */}
        <div className="lg:hidden">
          <WorkflowStepper currentStep={currentStep} />
        </div>
        {children}
      </div>
    </div>
  );
}
