"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchGoogleClientId } from "@/lib/auth";

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void | Promise<void>;
  submitting?: boolean;
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function GoogleSignInButton({
  onCredential,
  submitting = false,
}: GoogleSignInButtonProps) {
  const hiddenRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      if (response.credential) {
        void onCredential(response.credential);
      }
    },
    [onCredential],
  );

  useEffect(() => {
    let cancelled = false;
    fetchGoogleClientId()
      .then((id) => {
        if (!cancelled) {
          setClientId(id);
          if (!id) {
            setConfigError("Google sign-in is not configured on the server.");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClientId("");
          setConfigError("Could not load Google sign-in.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const scriptId = "google-gsi-client";

    function initGoogle() {
      const google = window.google;
      if (!google?.accounts?.id || !hiddenRef.current) return;

      google.accounts.id.initialize({
        client_id: clientId as string,
        callback: handleCredential,
        ux_mode: "popup",
        auto_select: false,
      });

      hiddenRef.current.innerHTML = "";
      google.accounts.id.renderButton(hiddenRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });

      setReady(true);
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.accounts?.id) {
        initGoogle();
      } else {
        existing.addEventListener("load", initGoogle);
        return () => existing.removeEventListener("load", initGoogle);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, [clientId, handleCredential]);

  function triggerGoogleSignIn() {
    const button = hiddenRef.current?.querySelector(
      'div[role="button"]',
    ) as HTMLElement | null;
    if (button) {
      button.click();
      return;
    }
    window.google?.accounts?.id?.prompt();
  }

  if (clientId === null) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    );
  }

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title={configError || "Set GOOGLE_CLIENT_ID in backend/.env"}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-slate-400 opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    );
  }

  return (
    <>
      <div ref={hiddenRef} className="sr-only" aria-hidden />
      <button
        type="button"
        onClick={triggerGoogleSignIn}
        disabled={!ready || submitting}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {submitting ? "Signing in with Google…" : "Continue with Google"}
      </button>
    </>
  );
}
