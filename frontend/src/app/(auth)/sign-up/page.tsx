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

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const { user, loading, signUp, signInWithGoogle } = useAuth();
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
      mode="sign-up"
      returnTo={returnTo}
      onSubmit={async ({ name, email, password, jobRole, district }) => {
        await signUp({
          name: name!,
          email,
          password,
          jobRole: jobRole!,
          district,
        });
        showToast("Account created — you can now upload your circular.", "success");
        router.push(returnTo);
      }}
      onGoogleSignIn={async (credential) => {
        await signInWithGoogle(credential);
        showToast("Signed in with Google — you can now upload your circular.", "success");
        router.push(returnTo);
      }}
    />
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-400">Loading…</p>}>
      <SignUpContent />
    </Suspense>
  );
}
