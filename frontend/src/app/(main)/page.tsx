import AnimateIn from "@/components/AnimateIn";
import FeatureSection from "@/components/FeatureSection";
import HeroActions from "@/components/HeroActions";
import HeroBackground from "@/components/HeroBackground";
import ProcessingStatus from "@/components/ProcessingStatus";
import UploadDropzone from "@/components/UploadDropzone";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200 bg-hero-light dark:border-slate-800 dark:bg-hero-dark">
        <HeroBackground />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-coral-500" />
                Ministry of Education · Sri Lanka
              </span>
            </div>
            <h1
              className="mt-5 animate-fade-in-up text-3xl font-extrabold tracking-tight text-slate-900 opacity-0 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl"
              style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
            >
              Read circulars in <span className="gradient-text">minutes</span>,
              not hours
            </h1>
            <p
              className="mt-5 animate-fade-in-up text-base leading-relaxed text-slate-600 opacity-0 dark:text-slate-300 sm:text-lg"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              Upload an official school circular, check the extracted text, and
              get a clear summary with the important dates and actions pulled out
              for you.
            </p>
            <div
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
            >
              <HeroActions />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <AnimateIn>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              How it works
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Four simple steps, made for busy school staff.
            </p>
          </div>
        </AnimateIn>
        <AnimateIn delay={100}>
          <ProcessingStatus currentStep={1} />
        </AnimateIn>
      </section>

      <section
        id="upload"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-14 sm:px-6 sm:pb-20"
      >
        <AnimateIn>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Upload a circular
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Start with a PDF from the Ministry of Education.
            </p>
          </div>
        </AnimateIn>
        <AnimateIn delay={150}>
          <UploadDropzone disabled />
        </AnimateIn>
      </section>

      <section className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <AnimateIn>
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Built around what schools actually need
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Shaped by feedback from principals, teachers, and admin officers.
              </p>
            </div>
          </AnimateIn>
          <FeatureSection />
        </div>
      </section>
    </div>
  );
}
