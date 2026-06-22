"use client";

import { WORKFLOW_STEPS } from "@/lib/contracts";

type WorkflowSliderProps = {
  currentStep: number;
  orientation?: "vertical" | "horizontal";
};

const CheckIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function WorkflowSlider({
  currentStep,
  orientation = "vertical",
}: WorkflowSliderProps) {
  const steps = WORKFLOW_STEPS;
  const count = steps.length;
  const clamped = Math.min(Math.max(currentStep, 1), count);
  // Fraction of the rail (between first and last marker) that is filled.
  const progress = count > 1 ? (clamped - 1) / (count - 1) : 0;
  // Each marker sits at the centre of its equally sized slot.
  const edge = 100 / (count * 2); // half-slot margin in %
  const railSpan = 100 - edge * 2; // distance between first and last marker

  if (orientation === "horizontal") {
    return (
      <nav aria-label="Workflow progress" className="w-full">
        <div className="relative px-1">
          {/* Rail */}
          <div
            className="absolute top-3.5 h-1 -translate-y-1/2 rounded-full bg-ink-200 dark:bg-ink-800"
            style={{ left: `${edge}%`, right: `${edge}%` }}
          />
          {/* Filled portion */}
          <div
            className="absolute top-3.5 h-1 -translate-y-1/2 rounded-full bg-brand-600 transition-all duration-500 ease-out dark:bg-brand-500"
            style={{ left: `${edge}%`, width: `${progress * railSpan}%` }}
          />
          <ol className="relative flex">
            {steps.map((step) => {
              const done = clamped > step.id;
              const active = clamped === step.id;
              return (
                <li key={step.key} className="flex flex-1 flex-col items-center gap-2">
                  <Marker done={done} active={active} id={step.id} />
                  <span
                    className={`text-center text-[11px] font-semibold leading-tight ${
                      active
                        ? "text-brand-700 dark:text-brand-300"
                        : done
                          ? "text-ink-700 dark:text-ink-300"
                          : "text-ink-400 dark:text-ink-500"
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

  return (
    <nav aria-label="Workflow progress" className="relative">
      {/* Rail */}
      <div
        className="absolute left-[15px] w-1 -translate-x-1/2 rounded-full bg-ink-200 dark:bg-ink-800"
        style={{ top: `${edge}%`, bottom: `${edge}%` }}
      />
      {/* Filled portion */}
      <div
        className="absolute left-[15px] w-1 -translate-x-1/2 rounded-full bg-brand-600 transition-all duration-500 ease-out dark:bg-brand-500"
        style={{ top: `${edge}%`, height: `${progress * railSpan}%` }}
      />
      <ol className="relative flex flex-col">
        {steps.map((step) => {
          const done = clamped > step.id;
          const active = clamped === step.id;
          return (
            <li key={step.key} className="flex min-h-[68px] items-center gap-3.5">
              <Marker done={done} active={active} id={step.id} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold leading-tight ${
                    active
                      ? "text-brand-700 dark:text-brand-300"
                      : done
                        ? "text-ink-800 dark:text-ink-200"
                        : "text-ink-400 dark:text-ink-500"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs font-medium text-ink-500 dark:text-ink-500">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Marker({ done, active, id }: { done: boolean; active: boolean; id: number }) {
  if (active) {
    // The "slider handle" — larger and lifted off the rail.
    return (
      <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/30" />
        <span className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-brand-600 bg-white text-xs font-bold text-brand-700 shadow-md shadow-brand-600/25 ring-4 ring-brand-100 dark:border-brand-500 dark:bg-ink-950 dark:text-brand-300 dark:ring-brand-950">
          {id}
        </span>
      </span>
    );
  }

  if (done) {
    return (
      <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white dark:bg-brand-500">
          <CheckIcon />
        </span>
      </span>
    );
  }

  return (
    <span className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink-300 bg-white text-[10px] font-bold text-ink-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-500">
        {id}
      </span>
    </span>
  );
}
