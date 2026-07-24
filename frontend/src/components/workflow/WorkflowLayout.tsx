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
  const allStepsDone = currentStep > WORKFLOW_STEPS.length || circular.status === "completed";
  const clamped = Math.min(Math.max(currentStep, 1), WORKFLOW_STEPS.length);

  const stats = [
    circular.processingMeta.pageCount > 0 && `${circular.processingMeta.pageCount} pg`,
    words > 0 && `${words.toLocaleString()} words`,
    circular.entities.length > 0 && `${circular.entities.length} entities`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-12 z-20 border-b border-white/10 bg-black/60 backdrop-blur-2xl md:top-0">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-3 sm:gap-3 sm:py-4 md:flex-row md:items-start md:justify-between lg:px-8">
          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1.5 text-[10px] font-medium sm:text-[11px]">
              <Link href="/circulars" className="shrink-0 text-slate-500 transition hover:text-cyan-300">
                Documents
              </Link>
              <svg className="hidden h-3 w-3 shrink-0 text-slate-600 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="hidden truncate text-slate-400 sm:inline">{circular.originalFilename}</span>
            </nav>

            <div className="mt-1.5 flex items-start gap-2.5 sm:mt-2 sm:gap-3">
              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-cyan-300 sm:flex sm:h-10 sm:w-10">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="min-w-0 text-sm font-bold leading-snug tracking-tight text-white sm:text-lg md:text-xl">
                    <span className="line-clamp-2 sm:truncate">{circular.originalFilename}</span>
                  </h1>
                  <StatusBadge status={circular.status} className="shrink-0" />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-medium text-slate-500 sm:text-[11px]">
                  <span className="shrink-0">{formatRelativeTime(circular.updatedAt)}</span>
                  {stats.map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className="h-0.5 w-0.5 rounded-full bg-slate-600" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {actions && (
            <div className="hidden shrink-0 items-center md:flex">{actions}</div>
          )}
        </div>

        <div className="border-t border-white/5 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <ol className="mx-auto flex w-full max-w-[1600px] items-center">
            {WORKFLOW_STEPS.map((step, i) => {
              const done = allStepsDone || clamped > step.id;
              const active = !allStepsDone && clamped === step.id;
              const isLast = i === WORKFLOW_STEPS.length - 1;
              return (
                <li
                  key={step.key}
                  className={`flex items-center ${isLast ? "shrink-0" : "min-w-0 flex-1 sm:flex-none"}`}
                >
                  <span
                    className={`mx-auto inline-flex shrink-0 items-center justify-center gap-1 rounded-full transition sm:mx-0 sm:gap-1.5 ${
                      active
                        ? "h-8 w-8 bg-white text-slate-900 shadow-lg shadow-white/10 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
                        : done
                          ? "h-8 w-8 border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
                          : "h-8 w-8 border border-white/10 bg-white/[0.03] text-slate-500 sm:h-auto sm:w-auto sm:px-3 sm:py-1"
                    }`}
                    title={step.label}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black sm:h-3.5 sm:w-3.5 ${
                        active
                          ? "bg-slate-900 text-white"
                          : done
                            ? "bg-cyan-400/25 text-cyan-200"
                            : "bg-white/10 text-slate-500"
                      }`}
                    >
                      {done ? (
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </span>
                    <span className="hidden text-[11px] font-semibold sm:inline">{step.label}</span>
                  </span>
                  {!isLast && (
                    <span
                      className={`mx-1 h-px min-w-[8px] flex-1 sm:mx-1.5 sm:w-6 sm:flex-none ${
                        done ? "bg-cyan-400/40" : "bg-white/10"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
    </div>
  );
}
