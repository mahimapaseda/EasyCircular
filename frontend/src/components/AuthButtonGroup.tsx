import Link from "next/link";

export default function AuthButtonGroup({ className = "" }: { className?: string }) {
  return (
    <div className={`auth-group ${className}`}>
      <Link href="/sign-in" className="auth-group-sign-in flex-1 text-center sm:flex-none">
        Sign in
      </Link>
      <Link href="/sign-up" className="auth-group-sign-up flex-1 text-center sm:flex-none">
        Sign up
      </Link>
    </div>
  );
}
