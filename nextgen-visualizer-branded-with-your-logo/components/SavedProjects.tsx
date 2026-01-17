"use client";

import React, { useEffect, useState } from "react";

type SavedProject = any;

export default function SavedProjects(props: {
  onLoad: (project: SavedProject) => void;
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/projects");
      const data = await r.json();
      setProjects(data.projects ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open) refresh(); }, [open]);

  async function remove(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    refresh();
  }

  if (!open) {
    return <button className="btn" onClick={() => setOpen(true)}>Saved projects</button>;
  }

  return (
    <div className="panel" style={{ position: "fixed", right: 18, top: 74, width: 420, zIndex: 50 }}>
      <div className="panelHeader">
        <div className="row">
          <span className="pill">Saved projects</span>
          <span className="pill">{loading ? "Loading..." : `${projects.length}`}</span>
        </div>
        <button className="btn" onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="panelBody" style={{ maxHeight: "70vh", overflow: "auto" }}>
        {projects.length === 0 ? (
          <div className="small">No saved projects yet.</div>
        ) : (
          <div className="productList">
            {projects.map((p: any) => (
              <div key={p.id} className="product">
                <img src={p.images?.[0] || "/bg.svg"} alt="thumb" />
                <div>
                  <div className="name">{p.projectType} • {p.style} • {p.quality}</div>
                  <div className="meta">{p.name} • {new Date(p.createdAt).toLocaleString()}</div>
                  <div className="meta">{p.email}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn primary" onClick={() => props.onLoad(p)}>Load</button>
                  <button className="btn" onClick={() => remove(p.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="hr" />
        <button className="btn" onClick={refresh}>Refresh</button>
      </div>
    </div>
  );
}
