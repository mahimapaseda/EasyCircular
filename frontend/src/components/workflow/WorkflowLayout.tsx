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
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="space-y-6">
          {/* Document info card */}
          <div className="overflow-hidden rounded-3xl border border-brand-200/50 bg-white/70 shadow-xl shadow-brand-900/5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/50">
            <div className="border-b border-brand-100/50 bg-gradient-to-r from-brand-50/50 to-transparent p-5 dark:border-ink-800/50 dark:from-brand-950/20">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-md shadow-brand-500/20">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 dark:text-brand-400 mb-1">
                    Workspace
                  </p>
                  <h2 className="break-words text-sm font-black leading-tight text-ink-900 dark:text-white">
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
                      className="col-span-1 rounded-2xl bg-ink-50/50 p-3 ring-1 ring-inset ring-brand-100/50 dark:bg-ink-900/30 dark:ring-ink-800/50"
                    >
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</dt>
                      <dd className="mt-1 truncate text-xs font-black text-ink-800 dark:text-ink-200">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Vertical stepper (desktop) */}
          <div className="hidden xl:block overflow-hidden rounded-3xl border border-brand-200/50 bg-white/70 p-5 shadow-xl shadow-brand-900/5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/50">
             <h3 className="text-xs font-black uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-6 ml-2">Workflow Status</h3>
             <WorkflowStepper currentStep={currentStep} orientation="vertical" />
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* Horizontal stepper (mobile) */}
          <div className="xl:hidden">
            <WorkflowStepper currentStep={currentStep} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
