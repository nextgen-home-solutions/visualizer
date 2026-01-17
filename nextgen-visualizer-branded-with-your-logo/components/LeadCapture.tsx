"use client";

import React, { useMemo, useState } from "react";

export type LeadInfo = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  timeline?: string;
};

export default function LeadCapture(props: {
  defaultEmail?: string;
  onSubmit: (lead: LeadInfo) => Promise<void> | void;
  consultUrl?: string;
}) {
  const [lead, setLead] = useState<LeadInfo>({
    name: "",
    email: props.defaultEmail ?? "",
    phone: "",
    address: "",
    timeline: "2-6 weeks",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return lead.name.trim().length >= 2 && /.+@.+\..+/.test(lead.email.trim());
  }, [lead]);

  async function submit() {
    setMsg(null);
    if (!canSubmit) {
      setMsg("Please enter a name and a valid email.");
      return;
    }
    setSaving(true);
    try {
      await props.onSubmit(lead);
      setMsg("Saved! We’ll reach out to confirm details.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="panelBody">
        <div className="label">Request a consult & save this project</div>

        <div className="grid2">
          <div>
            <div className="label">Name</div>
            <input className="input" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
          </div>
          <div>
            <div className="label">Email</div>
            <input className="input" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
          </div>
          <div>
            <div className="label">Phone</div>
            <input className="input" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
          </div>
          <div>
            <div className="label">Address (optional)</div>
            <input className="input" value={lead.address} onChange={(e) => setLead({ ...lead, address: e.target.value })} />
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div className="label">Timeline</div>
        <select className="select" value={lead.timeline} onChange={(e) => setLead({ ...lead, timeline: e.target.value })}>
          <option>ASAP</option>
          <option>2-6 weeks</option>
          <option>2-3 months</option>
          <option>3-6 months</option>
          <option>Just exploring</option>
        </select>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save project + request consult"}
          </button>
          {props.consultUrl ? (
            <a className="btn" href={props.consultUrl} target="_blank" rel="noreferrer">
              Book now
            </a>
          ) : null}
        </div>

        {msg ? <div className="small" style={{ marginTop: 10 }}>{msg}</div> : null}
        <div className="small" style={{ marginTop: 8 }}>
          Your info is used only to contact you about this estimate and visualization.
        </div>
      </div>
    </div>
  );
}
