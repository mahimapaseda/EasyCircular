import Link from "next/link";

type AuthButtonGroupProps = {
  className?: string;
  returnTo?: string;
};

function authHref(path: string, returnTo?: string) {
  if (!returnTo) return path;
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export default function AuthButtonGroup({ className = "", returnTo }: AuthButtonGroupProps) {
  return (
    <div className={`auth-group ${className}`}>
      <Link href={authHref("/sign-in", returnTo)} className="auth-group-sign-in flex-1 text-center sm:flex-none">
        Sign in
      </Link>
      <Link href={authHref("/sign-up", returnTo)} className="auth-group-sign-up flex-1 text-center sm:flex-none">
        Sign up
      </Link>
    </div>
  );
}
