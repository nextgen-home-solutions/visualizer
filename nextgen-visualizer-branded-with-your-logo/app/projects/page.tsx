"use client";

import React, { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch("/api/projects");
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Failed to load");
      setProjects(d.projects || []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ minHeight: "100vh", padding: 22, background: "#0b1020", color: "#f9fafb", fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <img src="/logo.svg" style={{ width: 240 }} />
        </a>
        <a href="/" style={{ padding: "10px 14px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, textDecoration: "none" }}>Back</a>
      </div>

      <div style={{ maxWidth: 1100, margin: "18px auto 0", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Saved projects</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>These are stored locally in a SQLite DB in the <code>data/</code> folder.</div>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {err ? <div style={{ fontSize: 12, opacity: 0.85 }}>Error: {err}</div> : null}
          {projects.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>No projects saved yet.</div>
          ) : (
            projects.map(p => (
              <a
                key={p.id}
                href={`/projects/${p.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                  background: "rgba(0,0,0,0.18)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14 }}>{p.projectType} • {p.style} • {p.quality}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{(p.leadName || "Lead not captured")} • {p.roomSizeSqft} sqft</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Updated: {new Date(p.updatedAt).toLocaleString()}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
