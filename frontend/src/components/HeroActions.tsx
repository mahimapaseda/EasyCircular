"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HeroActions() {
  const { user, loading } = useAuth();

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <a href="#upload" className="btn-primary">
        Upload a circular
      </a>
      {!loading && (
        user ? (
          <Link href="/circulars" className="btn-secondary">
            Your circulars
          </Link>
        ) : (
          <Link href="/sign-up" className="btn-secondary">
            Create free account
          </Link>
        )
      )}
    </div>
  );
}
