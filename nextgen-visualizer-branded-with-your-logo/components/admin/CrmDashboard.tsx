"use client";

import React, { useEffect, useMemo, useState } from "react";
import Kanban from "./Kanban";

type LeadRow = {
  id: string;
  created_at: string;
  lead_name: string;
  lead_email: string;
  lead_phone?: string;
  lead_timeline?: string;
  project_type: string;
  style: string;
  quality: string;
  room_size_sqft: number;
  status: string;
  source: string;
  assigned_to?: string;
  next_follow_up_at?: string;
  estimate?: any;
};

const STATUSES = ["New", "Contacted", "Qualified", "Estimate Sent", "Scheduled", "Won", "Lost"] as const;

export default function CrmDashboard({ token }: { token: string }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [status, setStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const u = new URL(window.location.origin + "/api/crm/leads");
      if (q.trim()) u.searchParams.set("q", q.trim());
      if (status) u.searchParams.set("status", status);
      
      const r = await fetch(u.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load");
      setLeads(data.leads || []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // initial

const stats = useMemo(() => {
  const now = Date.now();
  const overdue = (leads || []).filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() < now && !["Won","Lost"].includes(l.status));
  const dueToday = (leads || []).filter(l => {
    if (!l.next_follow_up_at) return false;
    const d = new Date(l.next_follow_up_at);
    const t = new Date();
    return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
  });
  return { total: leads.length, overdue: overdue.length, dueToday: dueToday.length };
}, [leads]);

  const csv = useMemo(() => {
    const rows = (leads || []).map(l => ({
      created_at: l.created_at,
      status: l.status,
      lead_name: l.lead_name,
      lead_email: l.lead_email,
      lead_phone: l.lead_phone || "",
      project_type: l.project_type,
      style: l.style,
      quality: l.quality,
      room_size_sqft: l.room_size_sqft,
      estimate_total: l.estimate?.total ?? "",
      next_follow_up_at: l.next_follow_up_at ?? "",
      lead_timeline: l.lead_timeline ?? "",
      id: l.id,
    }));
    const headers = Object.keys(rows[0] || {});
    const lines = [headers.join(",")].concat(
      rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? "")).join(","))
    );
    return lines.join("\n");
  }, [leads]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nextgen-leads.csv";
    a.click();
  }

  const visibleLeads = useMemo(() => {
    if (!overdueOnly) return leads;
    const now = Date.now();
    return (leads || []).filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() < now && !["Won","Lost"].includes(l.status));
  }, [leads, overdueOnly]);

  return (
    <div style={{ padding: 22, color: "#fff", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>NextGen CRM</h1>
          <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
            Leads captured from the Visualizer. Filters, notes, tasks, follow-ups.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setView(view === "list" ? "kanban" : "list")}>{view === "list" ? "Kanban view" : "List view"}</button>
          <button className="btn" onClick={downloadCsv} disabled={!visibleLeads.length}>Export CSV</button>
          <a className="btn" href="/admin/users">Users</a>
          <button className="btn primary" onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span className="pill">Total: {stats.total}</span>
        <button className="btn" onClick={() => setOverdueOnly(!overdueOnly)}>{overdueOnly ? "Show all" : `Overdue follow-ups (${stats.overdue})`}</button>
        <span className="pill">Due today: {stats.dueToday}</span>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 220px", gap: 10 }}>
        <input className="input" placeholder="Search name/email/phone..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
        <button className="btn" onClick={load} disabled={loading}>Apply</button>
        <button className="btn" onClick={() => { setQ(""); setStatus(""); setTimeout(load, 0); }} disabled={loading}>Clear</button>
      </div>

      {err ? <div style={{ marginTop: 12, opacity: 0.9 }}>Error: {err}</div> : null}

      {view === "kanban" ? (
  <div style={{ marginTop: 14 }}>
    <Kanban token={token} leads={visibleLeads} onMoved={load} />
  </div>
) : null}

{view === "list" ? (
<div style={{ overflowX: "auto", marginTop: 14, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.06)" }}>
              {["Created", "Status", "Name", "Email", "Phone", "Project", "Estimate", "Follow-up", "Open"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: 10, fontSize: 12, color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleLeads.map(l => (
              <tr key={l.id}>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.9 }}>
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="pill" style={{ opacity: 1 }}>{l.status}</span>
                </td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{l.lead_name}</td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{l.lead_email}</td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{l.lead_phone || "—"}</td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {l.project_type} • {l.style} • {l.quality}
                </td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {l.estimate?.total ? `$${Number(l.estimate.total).toLocaleString()}` : "—"}
                </td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: 10, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <a className="btn" href={`/admin/crm/${l.id}`}>Open</a>
                </td>
              </tr>
            ))}
            {!leads.length && !loading ? (
              <tr><td colSpan={9} style={{ padding: 14, opacity: 0.8 }}>No leads found.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      ) : null}

      <div style={{ opacity: 0.65, fontSize: 12, marginTop: 12 }}>
        Next steps: add user login, role-based access, pipeline automation, SMS/email sequences.
      </div>
    </div>
  );
}
