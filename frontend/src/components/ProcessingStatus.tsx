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
      {steps.map((step) => {
        const done = step.id < currentStep;
        const active = step.id === currentStep;

        return (
          <li
            key={step.id}
            className={`card p-4 ${
              active ? "ring-2 ring-brand-400 dark:ring-brand-500" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  done || active
                    ? `bg-gradient-to-br ${step.accent}`
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {done ? "✓" : step.id}
              </span>
              <span
                className={`text-sm font-semibold ${
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
          </li>
        );
      })}
    </ol>
  );
}
