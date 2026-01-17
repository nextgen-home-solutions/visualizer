"use client";

import React, { useEffect, useMemo, useState } from "react";

const STATUSES = ["New", "Contacted", "Qualified", "Estimate Sent", "Scheduled", "Won", "Lost"] as const;

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return d.toISOString();
}

function buildMailto(email: string, subject: string, body: string) {
  const qs = new URLSearchParams({ subject, body });
  return `mailto:${email}?${qs.toString()}`;
}

function buildSms(phone: string, body: string) {
  // iOS uses &body=, Android often uses ?body=
  const qs = new URLSearchParams({ body });
  return `sms:${phone}?${qs.toString()}`;
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); } catch {}
}

export default function LeadDetail({ id, token }: { id: string; token: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [lead, setLead] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [status, setStatus] = useState("New");
  const [assignedTo, setAssignedTo] = useState("");
  const [followUp, setFollowUp] = useState(""); // datetime-local
  const [noteBody, setNoteBody] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [leadResp, usersResp] = await Promise.all([
        fetch(`/api/crm/leads/${id}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`/api/crm/users`, { headers: { "Authorization": `Bearer ${token}` } }),
      ]);

      const leadData = await leadResp.json();
      const usersData = await usersResp.json();

      if (!leadResp.ok) throw new Error(leadData?.error || "Failed to load lead");
      if (!usersResp.ok) throw new Error(usersData?.error || "Failed to load users");

      setLead(leadData.lead);
      setNotes(leadData.notes || []);
      setTasks(leadData.tasks || []);
      setUsers(usersData.users || []);

      setStatus(leadData.lead?.status || "New");
      setAssignedTo(leadData.lead?.assigned_to || "");
      setFollowUp(leadData.lead?.next_follow_up_at ? toLocalInput(leadData.lead.next_follow_up_at) : "");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function saveCore(extra?: Record<string, any>) {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`/api/crm/leads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          id,
          status,
          assigned_to: assignedTo || null,
          next_follow_up_at: fromLocalInput(followUp),
          ...extra,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to save");
      setLead(data.lead);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function markContactedNow() {
    // Just store last_contacted_at on the lead
    await saveCore({ last_contacted_at: new Date().toISOString() });
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`/api/crm/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ lead_id: id, author: assignedTo || null, body: noteBody.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to add note");
      setNotes(prev => [data.note, ...prev]);
      setNoteBody("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  async function addTask() {
    if (!taskTitle.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const due = taskDue ? new Date(taskDue).toISOString() : null;
      const r = await fetch(`/api/crm/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ lead_id: id, title: taskTitle.trim(), due_at: due }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to add task");
      setTasks(prev => [...prev, data.task].sort((a,b) => (a.completed - b.completed) || ((a.due_at||"").localeCompare(b.due_at||""))));
      setTaskTitle("");
      setTaskDue("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add task");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`/api/crm/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ id: taskId, completed }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to update task");
      setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  const estimateText = useMemo(() => {
    const e = lead?.estimate;
    if (!e?.total) return "—";
    const low = e.range?.low ?? 0;
    const high = e.range?.high ?? 0;
    return `$${Number(e.total).toLocaleString()} (low $${Number(low).toLocaleString()} – high $${Number(high).toLocaleString()})`;
  }, [lead]);

  const templates = useMemo(() => {
    const name = lead?.lead_name?.split(" ")?.[0] || "there";
    const proj = `${lead?.project_type || "project"} • ${lead?.style || ""}`.trim();
    return [
      {
        label: "Intro",
        subject: "Your NextGen Visualizer Project",
        body: `Hi ${name},\n\nThanks for trying the NextGen Visualizer. I reviewed your concept and would love to help with the next steps.\n\nCan you share your ideal timeline and budget range for this ${proj}?\n\n— NEXTGEN home solutions`,
      },
      {
        label: "Schedule visit",
        subject: "Schedule your in-home consult",
        body: `Hi ${name},\n\nWant to schedule a quick in-home consult so we can confirm measurements and finalize your estimate?\n\nReply with 2–3 times that work for you, or book a slot here if you prefer.\n\n— NEXTGEN home solutions`,
      },
      {
        label: "Follow-up",
        subject: "Quick follow-up on your remodel",
        body: `Hi ${name},\n\nJust following up on your remodel concept. Any questions or changes you want to see in the design?\n\n— NEXTGEN home solutions`,
      },
    ];
  }, [lead]);

  const activity = useMemo(() => {
    const items: any[] = [];
    for (const n of notes) items.push({ type: "note", at: n.created_at, data: n });
    for (const t of tasks) items.push({ type: "task", at: t.created_at, data: t });
    items.sort((a,b) => String(b.at).localeCompare(String(a.at)));
    return items;
  }, [notes, tasks]);

  if (loading) return <div style={{ padding: 22, color: "#fff" }}>Loading...</div>;
  if (err && !lead) return <div style={{ padding: 22, color: "#fff" }}>Error: {err}</div>;
  if (!lead) return <div style={{ padding: 22, color: "#fff" }}>Not found.</div>;

  const phone = lead.lead_phone || "";
  const email = lead.lead_email || "";
  const address = lead.lead_address || "";
  const maps = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "";

  return (
    <div style={{ padding: 22, color: "#fff", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>{lead.lead_name}</h1>
          <div style={{ opacity: 0.85, marginTop: 6, fontSize: 13 }}>
            <span style={{ marginRight: 10 }}>{email}</span>
            <span style={{ marginRight: 10 }}>{phone || "—"}</span>
            <span style={{ marginRight: 10 }}>{lead.project_type} • {lead.style} • {lead.quality}</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {phone ? <a className="btn" href={`tel:${phone}`}>Call</a> : null}
            {phone ? <a className="btn" href={buildSms(phone, `Hi ${lead.lead_name?.split(" ")?.[0] || ""} — this is NEXTGEN home solutions. Quick question about your remodel concept...`)}>Text</a> : null}
            {email ? (
              <a className="btn" href={buildMailto(email, templates[0].subject, templates[0].body)}>Email</a>
            ) : null}
            {address && maps ? <a className="btn" href={maps} target="_blank" rel="noreferrer">Map</a> : null}
            <button className="btn" onClick={() => copy(email)}>Copy email</button>
            {phone ? <button className="btn" onClick={() => copy(phone)}>Copy phone</button> : null}
            <button className="btn green" onClick={markContactedNow} disabled={saving}>Mark contacted</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="btn" href={`/admin/crm`}>Back</a>
          <button className="btn primary" onClick={() => saveCore()} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      {err ? <div style={{ marginTop: 10, opacity: 0.95 }}>Error: {err}</div> : null}

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="panel">
          <div className="panelHeader">
            <div className="row">
              <span className="pill">Lead</span>
              <span className="pill">{lead.status}</span>
              {lead.next_follow_up_at ? (
                <span className="pill">Follow-up: {new Date(lead.next_follow_up_at).toLocaleDateString()}</span>
              ) : null}
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="label">Status</div>
                <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="label">Assigned to</div>
                <select className="select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div className="label">Next follow-up</div>
            <input className="input" type="datetime-local" value={followUp} onChange={e => setFollowUp(e.target.value)} />

            <div className="hr" />
            <div className="label">Estimate</div>
            <div className="small" style={{ opacity: 0.98 }}>{estimateText}</div>

            <div className="hr" />
            <div className="label">Customer description</div>
            <div className="small" style={{ whiteSpace: "pre-wrap" }}>{lead.description || "—"}</div>

            <div className="hr" />
            <div className="label">Email templates</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {templates.map(t => (
                <a key={t.label} className="btn" href={buildMailto(email, t.subject, t.body)}>{t.label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="row">
              <span className="pill">Tasks</span>
              <span className="pill">{tasks.filter(t => !t.completed).length} open</span>
            </div>
          </div>
          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="label">New task</div>
                <input className="input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Call customer / send quote / schedule visit..." />
              </div>
              <div>
                <div className="label">Due</div>
                <input className="input" type="datetime-local" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn green" onClick={addTask} disabled={saving}>Add task</button>
            </div>

            <div className="hr" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map(t => (
                <div key={t.id} className="product" style={{ gridTemplateColumns: "32px 1fr auto" }}>
                  <input
                    type="checkbox"
                    checked={!!t.completed}
                    onChange={(e) => toggleTask(t.id, e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <div className="name" style={{ textDecoration: t.completed ? "line-through" : "none", opacity: t.completed ? 0.7 : 1 }}>
                      {t.title}
                    </div>
                    <div className="meta">Due: {t.due_at ? new Date(t.due_at).toLocaleString() : "—"}</div>
                  </div>
                  <span className="pill">{t.completed ? "Done" : "Open"}</span>
                </div>
              ))}
              {!tasks.length ? <div className="small">No tasks yet.</div> : null}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="panel">
        <div className="panelHeader">
          <div className="row">
            <span className="pill">Notes</span>
            <span className="pill">{notes.length}</span>
          </div>
        </div>
        <div className="panelBody">
          <div className="label">Add internal note</div>
          <textarea className="textarea" value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder="Example: Customer prefers white cabinets + quartz. Wants estimate by Friday." />
          <div style={{ marginTop: 10 }}>
            <button className="btn green" onClick={addNote} disabled={saving}>Add note</button>
          </div>

          <div className="hr" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notes.map(n => (
              <div key={n.id} className="bubble ai" style={{ maxWidth: "100%" }}>
                <div className="small" style={{ opacity: 0.75 }}>
                  {n.author ? `${n.author} • ` : ""}{new Date(n.created_at).toLocaleString()}
                </div>
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{n.body}</div>
              </div>
            ))}
            {!notes.length ? <div className="small">No notes yet.</div> : null}
          </div>

          <div className="hr" />
          <div className="label">Activity timeline</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activity.map((a, idx) => (
              <div key={idx} className="product" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <div className="name">{a.type === "note" ? "Note added" : "Task created"}</div>
                  <div className="meta">{new Date(a.at).toLocaleString()}</div>
                </div>
                <span className="pill">{a.type}</span>
              </div>
            ))}
            {!activity.length ? <div className="small">No activity yet.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
