"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/#upload";
  }
  return value;
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const { user, loading, signIn } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      router.replace(returnTo);
    }
  }, [user, loading, router, returnTo]);

  if (loading || user) {
    return <p className="text-center text-sm text-slate-400">Loading…</p>;
  }

  return (
    <AuthForm
      mode="sign-in"
      returnTo={returnTo}
      onSubmit={async ({ email, password }) => {
        await signIn(email, password);
        showToast("Signed in — you can now upload your circular.", "success");
        router.push(returnTo);
      }}
    />
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-400">Loading…</p>}>
      <SignInContent />
    </Suspense>
  );
}
