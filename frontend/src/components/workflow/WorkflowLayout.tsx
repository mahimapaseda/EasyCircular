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
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="panel">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Document
          </p>
          <h2 className="mt-2 break-words text-base font-bold text-ink-900 dark:text-white">
            {circular.originalFilename}
          </h2>
          <div className="mt-3">
            <StatusBadge status={circular.status} />
          </div>
          {circular.processingMeta.pageCount > 0 && (
            <dl className="mt-4 space-y-2 text-xs text-ink-500 dark:text-ink-400">
              <div className="flex justify-between gap-2">
                <dt>Pages</dt>
                <dd className="font-medium text-ink-700 dark:text-ink-300">
                  {circular.processingMeta.pageCount}
                </dd>
              </div>
              {circular.processingMeta.ocrUsed && (
                <div className="flex justify-between gap-2">
                  <dt>OCR</dt>
                  <dd className="font-medium text-ink-700 dark:text-ink-300">
                    {circular.processingMeta.ocrLang || "enabled"}
                  </dd>
                </div>
              )}
              {circular.processingMeta.model && circular.status === "completed" && (
                <div className="flex justify-between gap-2">
                  <dt>Model</dt>
                  <dd className="truncate font-medium text-ink-700 dark:text-ink-300">
                    {circular.processingMeta.model}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="hidden lg:block">
          <WorkflowStepper currentStep={currentStep} orientation="vertical" />
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <div className="lg:hidden">
          <WorkflowStepper currentStep={currentStep} />
        </div>
        {children}
      </div>
    </div>
  );
}
