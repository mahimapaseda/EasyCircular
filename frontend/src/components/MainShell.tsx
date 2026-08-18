"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ThemedBackdrop from "@/components/ThemedBackdrop";

export default function MainShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
      <ThemedBackdrop overlay="main" interactive />
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
