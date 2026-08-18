"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import WorkflowSlider from "@/components/workflow/WorkflowSlider";
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
  const completed = circular.status === "completed";
  const allStepsDone = currentStep > WORKFLOW_STEPS.length || completed;
  const clamped = Math.min(Math.max(currentStep, 1), WORKFLOW_STEPS.length);
  const activeStep =
    WORKFLOW_STEPS.find((s) => s.id === clamped) ?? WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1];

  const stats = [
    circular.processingMeta.pageCount > 0 && `${circular.processingMeta.pageCount} pg`,
    words > 0 && `${words.toLocaleString()} words`,
    circular.entities.length > 0 && `${circular.entities.length} entities`,
    circular.processingMeta.ocrUsed &&
      circular.processingMeta.ocrLang &&
      `OCR ${circular.processingMeta.ocrLang}`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-12 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 md:top-0">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <nav className="flex items-center gap-1.5 text-[11px] font-medium">
                <Link href="/circulars" className="text-ink-600 transition hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300">
                  Library
                </Link>
                <span className="text-ink-300 dark:text-slate-600" aria-hidden>
                  /
                </span>
                <span className="truncate text-ink-600 dark:text-slate-300">{circular.originalFilename}</span>
              </nav>

              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2.5">
                <h1 className="min-w-0 truncate font-display text-lg font-bold tracking-tight text-ink-900 sm:text-xl dark:text-white">
                  {circular.originalFilename}
                </h1>
                <StatusBadge status={circular.status} className="shrink-0" />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-700 dark:text-slate-400">
                <span>{formatRelativeTime(circular.updatedAt)}</span>
                {stats.map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-ink-400 dark:bg-slate-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 lg:max-w-md lg:items-end">
              <div className="hidden w-full lg:block">
                <WorkflowSlider currentStep={allStepsDone ? WORKFLOW_STEPS.length + 1 : clamped} />
              </div>
              {actions && <div className="hidden w-full justify-end lg:flex">{actions}</div>}
            </div>
          </div>

          <div className="mt-4 lg:hidden">
            <WorkflowSlider currentStep={allStepsDone ? WORKFLOW_STEPS.length + 1 : clamped} />
            <p className="mt-2 text-center text-[11px] font-medium text-ink-700 dark:text-slate-400">
              {allStepsDone ? "Brief ready" : activeStep.description}
            </p>
          </div>
        </div>

        {actions && (
          <div className="border-t border-slate-200 px-4 py-2.5 dark:border-white/10 lg:hidden">
            <div className="mx-auto flex w-full max-w-[1400px] [&_button]:min-h-11 [&_button]:w-full">
              {actions}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
