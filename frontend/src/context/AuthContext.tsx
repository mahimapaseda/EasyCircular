"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchCurrentUser,
  login as apiLogin,
  register as apiRegister,
  setStoredToken,
  type User,
} from "@/lib/auth";
import { claimSessionCirculars } from "@/lib/circulars";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const attachSessionCirculars = useCallback(async () => {
    try {
      await claimSessionCirculars();
    } catch {
      // Non-fatal: user is signed in even if claim fails
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: nextUser, token } = await apiLogin(email, password);
    setStoredToken(token);
    setUser(nextUser);
    await attachSessionCirculars();
  }, [attachSessionCirculars]);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: nextUser, token } = await apiRegister(name, email, password);
      setStoredToken(token);
      setUser(nextUser);
      await attachSessionCirculars();
    },
    [attachSessionCirculars],
  );

  const signOut = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
