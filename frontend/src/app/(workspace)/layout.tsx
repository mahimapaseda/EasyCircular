import { Suspense } from "react";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-ink-500 dark:bg-slate-950 dark:text-slate-400">
          Loading workspace…
        </div>
      }
    >
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}
