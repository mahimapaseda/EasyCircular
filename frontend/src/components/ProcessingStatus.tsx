"use client";

const steps = [
  { id: 1, label: "Upload", description: "Pick a PDF circular", accent: "from-brand-500 to-grape-500" },
  { id: 2, label: "Extract", description: "Read the document text", accent: "from-grape-500 to-coral-500" },
  { id: 3, label: "Review", description: "Fix any mistakes", accent: "from-coral-500 to-sun-500" },
  { id: 4, label: "Summarize", description: "Get the summary", accent: "from-sun-500 to-mint-500" },
];

type ProcessingStatusProps = {
  currentStep?: number;
};

export default function ProcessingStatus({
  currentStep = 1,
}: ProcessingStatusProps) {
  return (
    <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {steps.map((step, i) => {
        const done = step.id < currentStep;
        const active = step.id === currentStep;

        return (
          <li
            key={step.id}
            className={`card transition-all duration-500 hover:-translate-y-0.5 p-4 ${
              active
                ? "ring-2 ring-brand-400 shadow-glow dark:ring-brand-500"
                : ""
            }`}
            style={{
              animationDelay: `${i * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-transform duration-300 ${
                  done || active
                    ? `bg-gradient-to-br ${step.accent} ${active ? "animate-bounce-gentle" : ""}`
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {done ? "✓" : step.id}
              </span>
              <span
                className={`text-sm font-semibold transition-colors duration-300 ${
                  active
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {step.label}
              </span>
            </div>
            <p className="mt-2 pl-10 text-xs text-slate-500 dark:text-slate-400">
              {step.description}
            </p>
            {active && (
              <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="absolute inset-y-0 left-0 w-1/3 animate-shimmer rounded-full bg-gradient-to-r from-brand-500 via-grape-500 to-coral-500" />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
