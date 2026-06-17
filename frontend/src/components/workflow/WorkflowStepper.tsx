"use client";

import { WORKFLOW_STEPS } from "@/lib/contracts";

type WorkflowStepperProps = {
  currentStep: number;
  orientation?: "horizontal" | "vertical";
};

const STEP_COLORS = [
  { active: "from-brand-500 to-indigo-600", glow: "shadow-brand-500/40", ring: "ring-brand-300 dark:ring-brand-600" },
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
    <nav aria-label="Workflow progress" className="relative">
      <ol className={isVertical ? "flex flex-col gap-6" : "grid grid-cols-2 gap-4 lg:grid-cols-4"}>
        {WORKFLOW_STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          const isPending = currentStep < step.id;
          const colors = STEP_COLORS[index % STEP_COLORS.length];

          return (
            <li
              key={step.key}
              className={`relative group transition-all duration-500 ${
                active ? "scale-105" : ""
              }`}
            >
              <div
                className={`relative z-10 flex ${isVertical ? "items-start gap-4" : "flex-col items-start gap-3"} rounded-3xl border border-transparent p-4 transition-all duration-300 ${
                  active
                    ? `border-brand-200/60 bg-white/80 shadow-xl shadow-brand-900/10 backdrop-blur-xl dark:border-brand-800/50 dark:bg-ink-950/80`
                    : done
                    ? "bg-white/40 dark:bg-ink-900/40"
                    : "opacity-60 grayscale-[50%]"
                }`}
              >
                {/* Step Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition-all duration-500 ${
                    done
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-ink-950"
                      : active
                      ? `bg-gradient-to-br ${colors.active} text-white shadow-lg ${colors.glow} ring-2 ring-white dark:ring-ink-950 scale-110`
                      : "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500"
                  }`}
                >
                  {done ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-black leading-tight tracking-tight ${
                      active
                        ? "text-brand-900 dark:text-white"
                        : done
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-ink-500 dark:text-ink-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink-500/80 dark:text-ink-400/80">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Active animated glow underneath */}
              {active && (
                <div className="absolute inset-0 -z-10 blur-xl transition-all duration-500 opacity-40">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colors.active}`} />
                </div>
              )}
              
              {/* Connector Lines (only if vertical) */}
              {isVertical && index < WORKFLOW_STEPS.length - 1 && (
                <div className="absolute left-[35px] top-[60px] h-[calc(100%-20px)] w-0.5 rounded-full bg-ink-200/50 dark:bg-ink-800/50">
                   {done && (
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
                   )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
