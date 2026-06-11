"use client";

import { WORKFLOW_STEPS } from "@/lib/contracts";

type WorkflowStepperProps = {
  currentStep: number;
  orientation?: "horizontal" | "vertical";
};

export default function WorkflowStepper({
  currentStep,
  orientation = "horizontal",
}: WorkflowStepperProps) {
  const isVertical = orientation === "vertical";

  return (
    <nav aria-label="Workflow progress">
      <ol
        className={
          isVertical
            ? "flex flex-col gap-1"
            : "grid grid-cols-2 gap-3 lg:grid-cols-4"
        }
      >
        {WORKFLOW_STEPS.map((step) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;

          return (
            <li
              key={step.key}
              className={`rounded-lg border px-3 py-3 transition ${
                active
                  ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/30"
                  : done
                    ? "border-brand-200 bg-white dark:border-brand-800 dark:bg-ink-900"
                    : "border-ink-200 bg-ink-50/80 dark:border-ink-800 dark:bg-ink-950/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done || active
                      ? "bg-brand-600 text-white"
                      : "bg-ink-200 text-ink-500 dark:bg-ink-700 dark:text-ink-400"
                  }`}
                >
                  {done ? "✓" : step.id}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      active
                        ? "text-brand-800 dark:text-brand-200"
                        : "text-ink-800 dark:text-ink-200"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {step.description}
                  </p>
                </div>
              </div>
              {active && (
                <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-950">
                  <div className="absolute inset-y-0 w-1/3 animate-pulsebar rounded-full bg-brand-500" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
