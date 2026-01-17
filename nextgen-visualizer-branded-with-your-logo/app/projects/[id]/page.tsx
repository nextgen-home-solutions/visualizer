"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Project = any;

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const r = await fetch(`/api/projects/${id}`);
        const j = await r.json();
        setProject(j.project ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href="/">
          <img src="/logo.png" alt="NEXTGEN home solutions" />
        </a>
        <div className="cta">
          <a className="btn" href="/">Home</a>
          <a className="btn" href="/admin/crm">CRM</a>
        </div>
      </header>

      <div style={{ maxWidth: 980, margin: "18px auto", padding: "0 18px" }}>
        {loading ? (
          <div className="panel">
            <div className="panelBody">Loading…</div>
          </div>
        ) : !project ? (
          <div className="panel">
            <div className="panelBody">Project not found.</div>
          </div>
        ) : (
          <div className="panel">
            <div className="panelHeader">
              <div className="row">
                <span className="pill">Project</span>
                <span className="pill">{project.project_type || "Remodel"}</span>
              </div>
            </div>
            <div className="panelBody">
              <div className="grid2">
                <div>
                  <div className="label">Lead</div>
                  <div className="value">{project.lead_name || "—"}</div>

                  <div className="label" style={{ marginTop: 10 }}>Email</div>
                  <div className="value">{project.lead_email || "—"}</div>

                  <div className="label" style={{ marginTop: 10 }}>Phone</div>
                  <div className="value">{project.lead_phone || "—"}</div>

                  <div className="label" style={{ marginTop: 10 }}>Status</div>
                  <div className="value">{project.status || "New"}</div>
                </div>

                <div>
                  <div className="label">Estimate</div>
                  <div className="value">
                    {project.estimate?.total ? `$${Number(project.estimate.total).toLocaleString()}` : "—"}
                  </div>

                  <div className="label" style={{ marginTop: 10 }}>Created</div>
                  <div className="value">{project.created_at ? new Date(project.created_at).toLocaleString() : "—"}</div>
                </div>
              </div>

              {project.final_image_url ? (
                <>
                  <div className="hr" />
                  <div className="label">Final visualization</div>
                  <img
                    src={project.final_image_url}
                    alt="Final visualization"
                    style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
