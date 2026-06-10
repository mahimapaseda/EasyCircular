export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-float absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/15" />
      <div
        className="animate-float-slow absolute -right-16 top-20 h-80 w-80 rounded-full bg-grape-300/25 blur-3xl dark:bg-grape-500/10"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="animate-float absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-coral-300/20 blur-3xl dark:bg-coral-500/10"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />
    </div>
  );
}
