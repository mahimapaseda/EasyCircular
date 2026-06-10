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
    return <p className="text-center text-sm text-slate-500">Loading…</p>;
  }

  return (
    <AuthForm
      mode="sign-in"
      onSubmit={async ({ email, password }) => {
        await signIn(email, password);
        router.push("/circulars");
      }}
    />
  );
}
