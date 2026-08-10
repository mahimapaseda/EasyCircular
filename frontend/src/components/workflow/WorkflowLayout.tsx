"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
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
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-12 z-20 border-b border-white/10 bg-black/55 backdrop-blur-2xl md:top-0">
        <div
          className={`mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 lg:px-8 ${
            completed ? "py-2 sm:py-2.5 md:py-3" : "py-2.5 sm:py-3 md:py-3.5"
          } md:flex-row md:items-center md:justify-between`}
        >
          <div className="min-w-0 flex-1">
            <nav
              className={`items-center gap-1.5 text-[10px] font-medium sm:text-[11px] ${
                completed ? "hidden md:flex" : "flex"
              }`}
            >
              <Link href="/circulars" className="shrink-0 text-slate-500 transition hover:text-cyan-300">
                Documents
              </Link>
              <span className="text-slate-700" aria-hidden>
                /
              </span>
              <span className="truncate text-slate-400">{circular.originalFilename}</span>
            </nav>

            <div className={`flex min-w-0 items-center gap-2.5 ${completed ? "mt-0 md:mt-1" : "mt-1"}`}>
              <h1 className="min-w-0 truncate font-display text-sm font-bold tracking-tight text-white sm:text-base md:text-lg">
                {circular.originalFilename}
              </h1>
              <StatusBadge status={circular.status} className="shrink-0" />
            </div>

            <div
              className={`mt-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-medium text-slate-500 sm:text-[11px] ${
                completed ? "hidden md:flex" : "flex"
              }`}
            >
              <span className="shrink-0">{formatRelativeTime(circular.updatedAt)}</span>
              {stats.map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-600" />
                  <span>{s}</span>
                </span>
              ))}
            </div>
            {completed && (
              <p className="mt-0.5 text-[10px] font-medium text-slate-500 md:hidden">
                {formatRelativeTime(circular.updatedAt)}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center md:gap-3">
            <div className="flex items-center gap-2">
              <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Workflow progress">
                {WORKFLOW_STEPS.map((step, i) => {
                  const done = allStepsDone || clamped > step.id;
                  const active = !allStepsDone && clamped === step.id;
                  const isLast = i === WORKFLOW_STEPS.length - 1;
                  return (
                    <li key={step.key} className="flex items-center gap-1.5 sm:gap-2">
                      <span className="inline-flex items-center gap-1.5" title={step.label}>
                        <span
                          className={`flex h-2.5 w-2.5 rounded-full transition sm:h-2 sm:w-2 ${
                            active
                              ? "bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.15)]"
                              : done
                                ? "bg-cyan-400"
                                : "bg-white/20"
                          }`}
                          aria-hidden
                        />
                        <span
                          className={`hidden text-[10px] font-semibold uppercase tracking-wide sm:inline ${
                            active
                              ? "text-white"
                              : done
                                ? "text-cyan-300/90"
                                : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </span>
                      {!isLast && (
                        <span
                          className={`hidden h-px w-4 sm:block ${done ? "bg-cyan-400/35" : "bg-white/10"}`}
                          aria-hidden
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:hidden">
                {allStepsDone ? "Done" : activeStep.label}
              </span>
            </div>

            {/* Desktop / large tablet header actions */}
            {actions && !completed && (
              <div className="hidden md:flex">{actions}</div>
            )}
            {actions && completed && (
              <div className="hidden lg:flex">{actions}</div>
            )}
          </div>
        </div>

        {/* Mobile primary CTA row */}
        {actions && (
          <div className="border-t border-white/5 px-4 py-2 md:hidden">
            <div className="mx-auto flex w-full max-w-[1600px] [&_button]:min-h-11 [&_button]:w-full">
              {actions}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        {children}
      </main>
    </div>
  );
}
