"use client";

import { WORKFLOW_STEPS } from "@/lib/contracts";

type WorkflowSliderProps = {
  currentStep: number;
  orientation?: "vertical" | "horizontal";
  /** Smaller markers/labels for sticky page headers. */
  compact?: boolean;
};

export default function WorkflowSlider({
  currentStep,
  orientation = "horizontal",
  compact = false,
}: WorkflowSliderProps) {
  const steps = WORKFLOW_STEPS;
  const count = steps.length;
  const clamped = Math.min(Math.max(currentStep, 1), count);
  const complete = currentStep > count;
  const progress = count > 1 ? (complete ? 1 : (clamped - 1) / (count - 1)) : 0;
  const edge = 100 / (count * 2);
  const railSpan = 100 - edge * 2;
  const railTop = compact ? "top-2.5" : "top-3.5";

  if (orientation === "vertical") {
    return (
      <nav aria-label="Workflow progress" className="relative py-1">
        <div
          className="absolute left-[15px] w-0.5 -translate-x-1/2 rounded-full bg-slate-200 dark:bg-white/15"
          style={{ top: `${edge}%`, bottom: `${edge}%` }}
        />
        <div
          className="absolute left-[15px] w-0.5 -translate-x-1/2 rounded-full bg-cyan-400 transition-all duration-500 ease-out"
          style={{ top: `${edge}%`, height: `${progress * railSpan}%` }}
        />
        <ol className="relative flex flex-col">
          {steps.map((step) => {
            const done = complete || clamped > step.id;
            const active = !complete && clamped === step.id;
            return (
              <li key={step.key} className="flex min-h-[64px] items-center gap-3.5">
                <Marker done={done} active={active} id={step.id} compact={false} />
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold leading-tight ${
                      active
                        ? "text-ink-900 dark:text-white"
                        : done
                          ? "text-cyan-700 dark:text-cyan-200"
                          : "text-ink-400 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Workflow progress" className="w-full">
      <div className="relative">
        <div
          className={`absolute ${railTop} h-0.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-white/15`}
          style={{ left: `${edge}%`, right: `${edge}%` }}
        />
        <div
          className={`absolute ${railTop} h-0.5 -translate-y-1/2 rounded-full bg-cyan-400 transition-all duration-500 ease-out`}
          style={{ left: `${edge}%`, width: `${progress * railSpan}%` }}
        />
        <ol className="relative flex">
          {steps.map((step) => {
            const done = complete || clamped > step.id;
            const active = !complete && clamped === step.id;
            return (
              <li
                key={step.key}
                className={`flex flex-1 flex-col items-center ${compact ? "gap-1" : "gap-1.5"}`}
              >
                <Marker done={done} active={active} id={step.id} compact={compact} />
                <span
                  className={`text-center font-bold uppercase ${
                    compact
                      ? "text-[9px] tracking-[0.1em]"
                      : "text-[10px] tracking-[0.14em]"
                  } ${
                    active
                      ? "text-ink-900 dark:text-white"
                      : done
                        ? "text-cyan-700 dark:text-cyan-300"
                        : "text-ink-400 dark:text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function Marker({
  done,
  active,
  id,
  compact,
}: {
  done: boolean;
  active: boolean;
  id: number;
  compact: boolean;
}) {
  const box = compact ? "h-5 w-5" : "h-7 w-7";
  const doneInner = compact ? "h-5 w-5" : "h-6 w-6";
  const idleInner = compact ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[10px]";
  const activeInner = compact
    ? "h-5 w-5 text-[9px] border"
    : "h-7 w-7 text-[11px] border-2";
  const icon = compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  if (active) {
    return (
      <span className={`relative z-10 flex ${box} shrink-0 items-center justify-center`}>
        {!compact && (
          <span className="absolute inset-0 animate-pulse rounded-full bg-cyan-400/25" />
        )}
        <span
          className={`relative flex items-center justify-center rounded-full border-cyan-500 bg-white font-bold text-cyan-700 dark:border-cyan-300 dark:bg-slate-950 dark:text-white ${activeInner} ${
            compact
              ? ""
              : "shadow-[0_0_0_4px_rgba(8,145,178,0.12)] dark:shadow-[0_0_0_4px_rgba(34,211,238,0.12)]"
          }`}
        >
          {id}
        </span>
      </span>
    );
  }

  if (done) {
    return (
      <span className={`relative z-10 flex ${box} shrink-0 items-center justify-center`}>
        <span
          className={`flex items-center justify-center rounded-full bg-cyan-400 text-slate-950 ${doneInner}`}
        >
          <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </span>
    );
  }

  return (
    <span className={`relative z-10 flex ${box} shrink-0 items-center justify-center`}>
      <span
        className={`flex items-center justify-center rounded-full border border-slate-300 bg-white font-bold text-ink-400 dark:border-white/20 dark:bg-slate-950 dark:text-slate-500 ${idleInner}`}
      >
        {id}
      </span>
    </span>
  );
}
