"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/circulars");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-hero-light px-4 py-12 dark:bg-hero-dark sm:py-16">
      <AuthForm
        mode="sign-in"
        onSubmit={async ({ email, password }) => {
          await signIn(email, password);
          router.push("/circulars");
        }}
      />
    </div>
  );
}
