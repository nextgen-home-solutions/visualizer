"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabasePublic } from "../../lib/supabase";

type AuthCtx = {
  token: string | null;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ token: null, email: null, loading: true, signOut: async () => {} });

const STORAGE_KEY = "nextgen_admin_access_token";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (!t) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, t);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t);
    setLoading(false);

    (async () => {
      if (!t) return;
      try {
        const supa = supabasePublic();
        const { data } = await supa.auth.getUser(t);
        setEmail(data.user?.email ?? null);
      } catch {
        setStoredToken(null);
        setToken(null);
      }
    })();
  }, []);

  const signOut = async () => {
    try {
      const supa = supabasePublic();
      await supa.auth.signOut();
    } catch {}
    setStoredToken(null);
    setToken(null);
    setEmail(null);
    window.location.href = "/admin/login";
  };

  const value = useMemo(() => ({ token, email, loading, signOut }), [token, email, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  return useContext(Ctx);
}
