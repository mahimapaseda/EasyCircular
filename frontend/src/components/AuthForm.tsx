"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import type { JobRole } from "@/lib/auth";
import { filterDistricts } from "@/lib/districts";

export type AuthFormSubmitData = {
  name?: string;
  email: string;
  password: string;
  jobRole?: JobRole;
  district?: string;
};

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  onSubmit: (data: AuthFormSubmitData) => Promise<void>;
  onGoogleSignIn?: (credential: string) => Promise<void>;
};

const JOB_ROLE_OPTIONS: { value: JobRole; label: string }[] = [
  { value: "teacher", label: "Teacher" },
  { value: "principal", label: "Principal" },
  { value: "education_administration", label: "Education administration" },
];

function FieldLabel({
  htmlFor,
  children,
  required = true,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-slate-200">
      {children}
      {required ? <span className="ml-1 text-rose-400">*</span> : null}
    </label>
  );
}

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

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20";

export default function AuthForm({ mode, returnTo, onSubmit, onGoogleSignIn }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobRole, setJobRole] = useState<JobRole | "">("");
  const [district, setDistrict] = useState("");
  const [districtOpen, setDistrictOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";
  const districtSuggestions = filterDistricts(district);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: isSignUp ? name : undefined,
        email,
        password,
        ...(isSignUp
          ? {
              jobRole: jobRole as JobRole,
              district: district.trim() || undefined,
            }
          : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    if (!onGoogleSignIn) return;
    setError(null);
    setGoogleSubmitting(true);
    try {
      await onGoogleSignIn(credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-7">
        <h1 className="text-2xl font-black tracking-tight text-white">
          {isSignUp ? "Create your account" : "Welcome back!"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {isSignUp
            ? "Create an account to upload and manage your circulars"
            : "Sign in to upload and manage your circulars"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass} pl-11 pr-4`}
                placeholder="Your full name"
              />
            </div>
          </div>
        )}

        <div>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} pl-11 pr-4`}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pl-11 pr-12`}
              placeholder={isSignUp ? "Min. 8 characters" : "Enter your password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isSignUp && (
          <>
            <div>
              <FieldLabel htmlFor="jobRole">Job role</FieldLabel>
              <select
                id="jobRole"
                required
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value as JobRole | "")}
                className={`${inputClass} px-4`}
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Select your role
                </option>
                {JOB_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <FieldLabel htmlFor="district" required={false}>
                District
              </FieldLabel>
              <input
                id="district"
                type="text"
                role="combobox"
                aria-expanded={districtOpen && districtSuggestions.length > 0}
                aria-controls="district-suggestions"
                aria-autocomplete="list"
                autoComplete="off"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setDistrictOpen(true);
                }}
                onFocus={() => setDistrictOpen(true)}
                onBlur={() => {
                  // Delay so suggestion click registers before close
                  window.setTimeout(() => setDistrictOpen(false), 120);
                }}
                className={`${inputClass} px-4`}
                placeholder="Start typing a district…"
              />
              {districtOpen && districtSuggestions.length > 0 ? (
                <ul
                  id="district-suggestions"
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-white/15 bg-slate-950/95 py-1 shadow-lg backdrop-blur"
                >
                  {districtSuggestions.map((name) => (
                    <li key={name} role="option">
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setDistrict(name);
                          setDistrictOpen(false);
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </>
        )}

        {!isSignUp && (
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-cyan-400"
              />
              Remember me
            </label>
            <Link
              href="#"
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </Link>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm font-medium text-rose-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-slate-900 shadow-lg shadow-white/10 transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Please wait…
            </>
          ) : isSignUp ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-black/40 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Or continue with
          </span>
        </div>
      </div>

      {onGoogleSignIn ? (
        <GoogleSignInButton
          onCredential={handleGoogleCredential}
          submitting={googleSubmitting}
        />
      ) : (
        <button
          type="button"
          disabled
          title="Google sign-in is not available"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-slate-400 opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      )}

      {/* Switch mode */}
      <p className="mt-7 text-center text-sm text-slate-400">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href={returnTo ? `/sign-in?returnTo=${encodeURIComponent(returnTo)}` : "/sign-in"}
              className="font-bold text-cyan-400 hover:text-cyan-300"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={returnTo ? `/sign-up?returnTo=${encodeURIComponent(returnTo)}` : "/sign-up"}
              className="font-bold text-cyan-400 hover:text-cyan-300"
            >
              Sign up free
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
