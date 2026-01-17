"use client";

import React, { useState } from "react";
import { supabasePublic } from "../../../lib/supabase";
import { setStoredToken } from "../../../components/admin/AdminAuthProvider";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signIn() {
    setErr(null);
    setBusy(true);
    try {
      const supa = supabasePublic();
      const { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const token = data.session?.access_token;
      if (!token) throw new Error("No access token returned");
      setStoredToken(token);
      window.location.href = "/admin/crm";
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href="/">
          <img src="/logo.png" alt="NEXTGEN home solutions" />
        </a>
        <div className="cta">
          <a className="btn" href="/">Back to site</a>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: "28px auto", padding: "0 18px" }}>
        <div className="panel">
          <div className="panelHeader">
            <div className="row">
              <span className="pill">Admin</span>
              <span className="pill">Sign in</span>
            </div>
          </div>
          <div className="panelBody">
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            <div style={{ height: 10 }} />
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

            {err ? <div className="small" style={{ marginTop: 10, opacity: 0.95 }}>Error: {err}</div> : null}

            <div style={{ marginTop: 14 }} className="row">
              <button className="btn primary" onClick={signIn} disabled={busy || !email || !password}>
                {busy ? "Signing in..." : "Sign in"}
              </button>
              <span className="small">Uses Supabase Auth.</span>
            </div>

            <div className="hr" />
            <div className="small">
              Tip: Create your first admin user in Supabase → Authentication → Users.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
