"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/circulars");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <p className="text-center text-sm text-ink-500">Loading…</p>;
  }

  return (
    <AuthForm
      mode="sign-up"
      onSubmit={async ({ name, email, password }) => {
        await signUp(name!, email, password);
        router.push("/circulars");
      }}
    />
  );
}
