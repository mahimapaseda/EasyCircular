export default function AuthIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-ink-50 to-brand-100 p-8 dark:from-ink-950 dark:via-brand-950 dark:to-ink-900">
      <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
      <div className="absolute bottom-10 right-0 h-48 w-48 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-700/20" />

      <svg
        viewBox="0 0 480 400"
        className="relative z-10 w-full max-w-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="280" y="60" width="140" height="240" rx="16" fill="#fff" stroke="#99f6e4" strokeWidth="2" />
        <rect x="295" y="85" width="110" height="8" rx="4" fill="#ccfbf1" />
        <circle cx="350" cy="120" r="22" fill="#ccfbf1" />
        <path d="M340 120h20M350 110v20" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
        <rect x="300" y="155" width="90" height="6" rx="3" fill="#ccfbf1" />
        <rect x="300" y="170" width="70" height="6" rx="3" fill="#ccfbf1" />
        <rect x="300" y="200" width="100" height="32" rx="8" fill="#0d9488" />
        <path d="M330 216h40" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="395" cy="130" r="14" fill="#10b981" />
        <path d="M389 130l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="60" y="140" width="80" height="70" rx="6" fill="#fff" stroke="#99f6e4" strokeWidth="2" />
        <path d="M60 155h80" stroke="#99f6e4" strokeWidth="2" />
        <rect x="72" y="165" width="20" height="30" fill="#ccfbf1" />
        <rect x="98" y="165" width="20" height="30" fill="#ccfbf1" />
        <rect x="124" y="165" width="8" height="30" fill="#ccfbf1" />
        <rect x="95" y="112" width="10" height="8" fill="#f43f5e" />

        <circle cx="200" cy="100" r="30" fill="#ccfbf1" stroke="#5eead4" strokeWidth="2" />
        <path d="M185 180c0-20 30-20 30 0v40h-30v-40z" fill="#0d9488" />
        <rect x="175" y="215" width="50" height="8" rx="4" fill="#0f766e" />
        <path d="M160 223h80" stroke="#0f766e" strokeWidth="6" strokeLinecap="round" />
        <circle cx="155" cy="230" r="8" fill="#0f766e" />
        <circle cx="245" cy="230" r="8" fill="#0f766e" />

        <path d="M230 200h30l20-40" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="120" cy="280" r="24" fill="#fff" stroke="#99f6e4" strokeWidth="2" />
        <path d="M108 280c0-8 24-8 24 0" stroke="#0d9488" strokeWidth="2" />
        <ellipse cx="120" cy="268" rx="10" ry="8" fill="#ccfbf1" />

        <rect x="300" y="300" width="120" height="60" rx="8" fill="#fff" stroke="#99f6e4" strokeWidth="2" />
        <path d="M315 320h90M315 335h60M315 350h75" stroke="#ccfbf1" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <div className="absolute bottom-8 left-8 right-8 text-center lg:text-left">
        <p className="text-lg font-bold text-ink-800 dark:text-white">
          MOE circulars, simplified
        </p>
        <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
          Upload, review, and summarise school circulars in one place.
        </p>
      </div>
    </div>
  );
}
