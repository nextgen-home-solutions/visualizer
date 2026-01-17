"use client";

import React, { useEffect, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "../../../components/admin/AdminAuthProvider";

function Inner() {
  const { token, loading, signOut, email } = useAdminAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [uemail, setUemail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !token) window.location.href = "/admin/login";
  }, [loading, token]);

  async function load() {
    if (!token) return;
    setErr(null);
    const r = await fetch("/api/crm/users", { headers: { "Authorization": `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) { setErr(data?.error || "Failed to load users"); return; }
    setUsers(data.users || []);
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function addUser() {
    if (!token || !name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/crm/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: uemail.trim() || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to create user");
      setName(""); setUemail("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div style={{ padding: 24, color: "#fff" }}>Loading...</div>;
  if (!token) return null;

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href="/">
          <img src="/logo.png" alt="NEXTGEN home solutions" />
        </a>
        <div className="cta">
          <span className="pill">{email || "Admin"}</span>
          <a className="btn" href="/admin/crm">CRM</a>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div style={{ padding: 22, color: "#fff", maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Users</h1>
        <div className="small" style={{ opacity: 0.8, marginTop: 6 }}>
          These users populate the “Assigned to” dropdown. (Auth is still controlled by Supabase + allowlist.)
        </div>

        {err ? <div style={{ marginTop: 12, opacity: 0.9 }}>Error: {err}</div> : null}

        <div style={{ marginTop: 14 }} className="panel">
          <div className="panelHeader"><div className="row"><span className="pill">Add user</span></div></div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="label">Name</div>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Aaron" />
              </div>
              <div>
                <div className="label">Email (optional)</div>
                <input className="input" value={uemail} onChange={e => setUemail(e.target.value)} placeholder="aaron@nextgen-ne.com" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn green" onClick={addUser} disabled={busy || !name.trim()}>{busy ? "Adding..." : "Add user"}</button>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 14, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                {["Created", "Name", "Email"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: 10, fontSize: 12, color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.9 }}>
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{u.name}</td>
                  <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{u.email || "—"}</td>
                </tr>
              ))}
              {!users.length ? <tr><td colSpan={3} style={{ padding: 14, opacity: 0.8 }}>No users yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminAuthProvider>
      <Inner />
    </AdminAuthProvider>
  );
}
