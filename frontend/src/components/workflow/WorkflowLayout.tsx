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
  const clamped = Math.min(Math.max(currentStep, 1), WORKFLOW_STEPS.length);

  const stats = [
    circular.processingMeta.pageCount > 0 && `${circular.processingMeta.pageCount} pages`,
    words > 0 && `${words.toLocaleString()} words`,
    circular.entities.length > 0 && `${circular.entities.length} entities`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1.5 text-[11px] font-medium">
              <Link href="/circulars" className="text-slate-500 transition hover:text-cyan-300">
                Documents
              </Link>
              <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="truncate text-slate-400">{circular.originalFilename}</span>
            </nav>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-cyan-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                    {circular.originalFilename}
                  </h1>
                  <StatusBadge status={circular.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] font-medium text-slate-500">
                  <span>Updated {formatRelativeTime(circular.updatedAt)}</span>
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
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        <div className="mx-auto w-full max-w-[1600px] overflow-x-auto border-t border-white/5 px-4 py-3 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-1.5">
            {WORKFLOW_STEPS.map((step, i) => {
              const done = clamped > step.id;
              const active = clamped === step.id;
              const isLast = i === WORKFLOW_STEPS.length - 1;
              return (
                <li key={step.key} className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "bg-white text-slate-900 shadow-lg shadow-white/10"
                        : done
                          ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border border-white/10 bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-black ${
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
                    {step.label}
                  </span>
                  {!isLast && (
                    <span
                      className={`h-px w-6 shrink-0 ${
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

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
