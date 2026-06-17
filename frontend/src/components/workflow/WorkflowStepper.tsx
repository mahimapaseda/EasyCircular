"use client";

import { WORKFLOW_STEPS } from "@/lib/contracts";

type WorkflowStepperProps = {
  currentStep: number;
  orientation?: "horizontal" | "vertical";
};

const STEP_COLORS = [
  { active: "from-brand-500 to-brand-600", glow: "shadow-brand-500/40", ring: "ring-brand-300 dark:ring-brand-600" },
  { active: "from-fuchsia-500 to-violet-600", glow: "shadow-fuchsia-500/40", ring: "ring-fuchsia-300 dark:ring-fuchsia-600" },
  { active: "from-amber-400 to-orange-500", glow: "shadow-amber-500/40", ring: "ring-amber-300 dark:ring-amber-600" },
  { active: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/40", ring: "ring-emerald-300 dark:ring-emerald-600" },
];

export default function WorkflowStepper({
  currentStep,
  orientation = "horizontal",
}: WorkflowStepperProps) {
  const isVertical = orientation === "vertical";

  return (
    <nav aria-label="Workflow progress">
      <ol className={isVertical ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3 lg:grid-cols-4"}>
        {WORKFLOW_STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          const colors = STEP_COLORS[index % STEP_COLORS.length];

          return (
            <li
              key={step.key}
              className={`rounded-2xl border-2 transition-all duration-300 ${
                active
                  ? `border-brand-200 bg-gradient-to-br from-brand-50 to-fuchsia-50/60 shadow-panel dark:border-brand-700/60 dark:from-brand-950/40 dark:to-fuchsia-950/20`
                  : done
                  ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white dark:border-emerald-900/60 dark:from-emerald-950/20 dark:to-ink-900"
                  : "border-ink-100 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-900/60"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Step number / check */}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-all duration-300 ${
                    done
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                      : active
                      ? `bg-gradient-to-br ${colors.active} text-white shadow-md ${colors.glow}`
                      : "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500"
                  }`}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>

                {/* Labels */}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold leading-tight ${
                      active
                        ? "text-brand-800 dark:text-brand-200"
                        : done
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-ink-600 dark:text-ink-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-ink-500 dark:text-ink-500">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Active progress bar */}
              {active && (
                <div className="relative mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-950">
                  <div className="absolute inset-y-0 w-1/3 animate-pulsebar rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
