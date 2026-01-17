"use client";

import React, { useMemo, useState } from "react";

const STATUSES = ["New", "Contacted", "Qualified", "Estimate Sent", "Scheduled", "Won", "Lost"] as const;

export default function Kanban({
  token,
  leads,
  onMoved,
}: {
  token: string;
  leads: any[];
  onMoved: () => Promise<void>;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const s of STATUSES) m[s] = [];
    for (const l of leads) {
      const s = l.status || "New";
      m[s] = [...(m[s] || []), l];
    }
    return m;
  }, [leads]);

  async function move(id: string, status: string) {
    await fetch("/api/crm/leads", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status }),
    });
    await onMoved();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, 320px)`, gap: 12, overflowX: "auto", paddingBottom: 10 }}>
      {STATUSES.map((s) => (
        <div key={s} style={{ border: "1px solid rgba(255,255,255,0.14)", borderRadius: 16, background: "rgba(255,255,255,0.04)", minHeight: 420 }}>
          <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.10)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="pill" style={{ opacity: 1 }}>{s}</span>
            <span className="small">{(byStatus[s] || []).length}</span>
          </div>

          <div
            style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = dragId || e.dataTransfer.getData("text/plain");
              if (id) move(id, s);
              setDragId(null);
            }}
          >
            {(byStatus[s] || []).map((l) => (
              <div
                key={l.id}
                draggable
                onDragStart={(e) => {
                  setDragId(l.id);
                  e.dataTransfer.setData("text/plain", l.id);
                }}
                className="product"
                style={{ gridTemplateColumns: "1fr auto", cursor: "grab" }}
                title="Drag to another column"
              >
                <div>
                  <div className="name">{l.lead_name}</div>
                  <div className="meta">{l.project_type} • {l.style} • {l.quality}</div>
                  <div className="meta">{l.lead_email}</div>
                  <div className="meta">
                    {l.estimate?.total ? `Est: $${Number(l.estimate.total).toLocaleString()}` : "Est: —"}
                    {" • "}
                    Follow-up: {l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleDateString() : "—"}
                  </div>
                </div>
                <a className="btn" href={`/admin/crm/${l.id}`}>Open</a>
              </div>
            ))}
            {(byStatus[s] || []).length === 0 ? <div className="small">Drop leads here</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
