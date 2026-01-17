"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { SelectedProduct } from "../lib/types";

type Msg = { role: "ai" | "user"; text: string };

function suggestOverlooked(projectType: string) {
  const map: Record<string, string[]> = {
    Kitchen: [
      "Under-cabinet lighting + dimmers",
      "Vent hood ducting / make-up air (if needed)",
      "GFCI outlets + dedicated circuits",
      "Trash pull-out + soft-close hardware"
    ],
    Bathroom: [
      "Full waterproofing system behind tile",
      "Quiet vent fan (properly ducted)",
      "Niche / shelving",
      "Heated floors (optional)"
    ],
    Basement: [
      "Moisture mitigation + dehumidification",
      "Egress (if bedroom)",
      "Insulation + vapor considerations",
      "Radon check (as needed)"
    ],
    Exterior: [
      "Flashing + housewrap continuity",
      "Trim package upgrades",
      "Soffit ventilation / attic airflow",
      "Gutter + drainage plan"
    ],
    Other: [
      "Permits + inspections",
      "Lighting plan",
      "Floor protection & dust control",
      "Final punch list / warranty"
    ]
  };
  return map[projectType] ?? map.Other;
}

export default function AiAssistant(props: {
  projectType: string;
  style: string;
  description: string;
  selectedProducts: SelectedProduct[];
  onSuggestionClick: (text: string) => void;
}) {
  const { projectType, style, description, selectedProducts } = props;
  const [msgs, setMsgs] = useState<Msg[]>([]);

  const productNames = useMemo(
    () => selectedProducts.map(p => p.name).slice(0, 6),
    [selectedProducts]
  );

  useEffect(() => {
    const base: Msg[] = [{
      role: "ai",
      text: "Hi — I’m the NextGen Visualizer. Upload a photo or use your camera, then tell me what you want the finished results to look like."
    }];
    setMsgs(base);
  }, []);

  const overlooked = useMemo(() => suggestOverlooked(projectType), [projectType]);

  function sendUser(text: string) {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: "user", text }]);

    // Simple "assistant" logic (MVP). Swap to LLM later.
    const next = buildResponse(text, { projectType, style, description, productNames });
    setMsgs(m => [...m, { role: "ai", text: next }]);
  }

  const [draft, setDraft] = useState("");

  return (
    <div className="chat">
      {msgs.map((m, i) => (
        <div key={i} className={"bubble " + (m.role === "ai" ? "ai" : "user")}>
          {m.text}
        </div>
      ))}

      <div className="panel" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="panelBody">
          <div className="label">Suggestions clients often overlook</div>
          <div className="row">
            {overlooked.map((s) => (
              <button key={s} className="btn" onClick={() => props.onSuggestionClick(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="hr" />
          <div className="label">Ask the Visualizer</div>
          <div className="row">
            <input
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g., Make it modern with white cabinets and warm oak floors..."
            />
            <button className="btn primary" onClick={() => { sendUser(draft); setDraft(""); }}>
              Send
            </button>
          </div>
          <div className="small" style={{ marginTop: 8 }}>
            Tip: mention layout, colors, and which surfaces to change (cabinets, counters, floors, walls, fixtures).
          </div>
        </div>
      </div>
    </div>
  );
}

function buildResponse(userText: string, ctx: { projectType: string; style: string; description: string; productNames: string[] }) {
  const bits: string[] = [];

  bits.push("Got it. Here’s what I’m tracking:");
  bits.push(`• Project type: ${ctx.projectType || "—"}`);
  bits.push(`• Target style: ${ctx.style || "—"}`);

  if (ctx.productNames.length) {
    bits.push(`• Selected products: ${ctx.productNames.join(", ")}`);
  } else {
    bits.push("• Selected products: none yet (optional).");
  }

  // Light guidance
  bits.push("");
  bits.push("If you want the image to come out realistic, tell me:");
  bits.push("• What to keep vs change (ex: keep layout, replace cabinets + counters)");
  bits.push("• Any must-have colors/materials");
  bits.push("• Budget level (Good / Better / Best)");

  // Echo user request
  bits.push("");
  bits.push(`Your request: “${userText.trim()}”`);

  return bits.join("\n");
}
