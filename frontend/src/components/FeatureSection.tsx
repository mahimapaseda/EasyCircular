const features = [
  {
    title: "Save reading time",
    description:
      "Long circulars become short, structured summaries your team can act on right away.",
    accent: "from-brand-500 to-grape-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "Spot what matters",
    description:
      "Dates, legal references, and responsible parties are picked out for you to double-check.",
    accent: "from-sun-500 to-coral-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      />
    ),
  },
  {
    title: "You stay in control",
    description:
      "Fix the extracted text before anything is summarized, so the result keeps the original meaning.",
    accent: "from-mint-500 to-brand-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
];

export default function FeatureSection() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <article
          key={feature.title}
          className="card group p-6 hover:-translate-y-1 hover:shadow-glow"
        >
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white shadow-sm`}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              {feature.icon}
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {feature.description}
          </p>
        </article>
      ))}
    </div>
  );
}
