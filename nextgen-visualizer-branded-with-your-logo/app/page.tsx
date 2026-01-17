"use client";

import React, { useEffect, useMemo, useState } from "react";
import CameraCapture from "../components/CameraCapture";
import ProductPalette from "../components/ProductPalette";
import AiAssistant from "../components/AiAssistant";
import LeadCapture, { LeadInfo } from "../components/LeadCapture";
import SavedProjects from "../components/SavedProjects";
import type { ProductCatalog, SelectedProduct } from "../lib/types";

type RenderVariant = { id: string; label: string; imageDataUrl: string };

export default function Page() {
  const consultUrl = process.env.NEXT_PUBLIC_CONSULT_URL;

  const [catalog, setCatalog] = useState<ProductCatalog | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const [projectType, setProjectType] = useState<"Kitchen" | "Bathroom" | "Basement" | "Exterior" | "Other">("Kitchen");
  const [style, setStyle] = useState("Transitional");
  const [quality, setQuality] = useState<"Good" | "Better" | "Best">("Better");
  const [roomSizeSqft, setRoomSizeSqft] = useState<number>(160);
  const [description, setDescription] = useState("");

  // Multi-image set support
  const [images, setImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  const imageDataUrl = images[activeImageIdx] ?? null;

  const [rendering, setRendering] = useState(false);
  const [promptSummary, setPromptSummary] = useState<string>("");
  const [variants, setVariants] = useState<RenderVariant[]>([]);
  const [activeVariant, setActiveVariant] = useState<string>("");

  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, []);

  const activeImage = useMemo(() => {
    const v = variants.find(x => x.id === activeVariant);
    return v?.imageDataUrl ?? imageDataUrl;
  }, [variants, activeVariant, imageDataUrl]);

  function resetProject() {
    setSelectedProducts([]);
    setProjectType("Kitchen");
    setStyle("Transitional");
    setQuality("Better");
    setRoomSizeSqft(160);
    setDescription("");
    setImages([]);
    setActiveImageIdx(0);
    setPromptSummary("");
    setVariants([]);
    setActiveVariant("");
    setEstimate(null);
    setError(null);
  }

  function onUpload(files: FileList) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    const readers = arr.map(f => new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(f);
    }));

    Promise.all(readers).then(urls => {
      setImages(prev => {
        const next = [...prev, ...urls];
        return next.slice(0, 12); // cap for MVP
      });
      setVariants([]);
      setEstimate(null);
      setError(null);
      setActiveImageIdx(0);
    });
  }

  async function generate() {
    setError(null);
    if (!imageDataUrl) {
      setError("Please upload or capture an image first.");
      return;
    }
    setRendering(true);
    setEstimate(null);

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          style,
          prompt: description,
          selectedProducts: selectedProducts.map(p => ({ sku: p.sku, name: p.name })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Render failed");
      setPromptSummary(data.promptSummary || "");
      setVariants(data.variants || []);
      setActiveVariant(data.variants?.[0]?.id ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Render failed.");
    } finally {
      setRendering(false);
    }
  }

  async function getEstimate() {
    setError(null);
    setEstimating(true);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType,
          roomSizeSqft,
          quality,
          selectedProducts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Estimate failed");
      setEstimate(data);
    } catch (e: any) {
      setError(e?.message ?? "Estimate failed.");
    } finally {
      setEstimating(false);
    }
  }

  function addSuggestionToDescription(text: string) {
    setDescription(d => (d ? `${d}\n- ${text}` : `- ${text}`));
  }

  async function saveProject(lead: LeadInfo) {
    if (!estimate) throw new Error("Please generate an estimate first.");

    const payload = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      ...lead,
      projectType,
      style,
      quality,
      roomSizeSqft,
      description,
      selectedProducts: selectedProducts.map(p => ({ sku: p.sku, name: p.name, qty: p.qty, price: p.price, unit: p.unit })),
      images,
      variants,
      estimate,
    };

    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Save failed");
  }

  function loadProject(p: any) {
    setProjectType(p.projectType);
    setStyle(p.style);
    setQuality(p.quality);
    setRoomSizeSqft(p.roomSizeSqft);
    setDescription(p.description);
    setSelectedProducts(p.selectedProducts?.map((x: any) => ({ ...x, brand: x.brand ?? "", image: x.image ?? "", })) ?? []);
    setImages(p.images ?? []);
    setActiveImageIdx(0);
    setVariants(p.variants ?? []);
    setActiveVariant(p.variants?.[0]?.id ?? "");
    setPromptSummary("");
    setEstimate(p.estimate ?? null);
    setError(null);
  }

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href="#">
          <img src="/logo.png" alt="NEXTGEN home solutions" />
        </a>
        <div className="cta">
          <SavedProjects onLoad={loadProject} />
          <button className="btn" onClick={resetProject}>New project</button>
          <button className="btn primary" onClick={generate} disabled={rendering}>
            {rendering ? "Generating..." : "Generate visualization"}
          </button>
        </div>
      </header>

      <main className="main">
        {/* LEFT: Visualizer */}
        <section className="panel">
          <div className="panelHeader">
            <div className="row">
              <span className="pill">NextGen Visualizer</span>
              <span className="pill">MVP + lead capture + saved projects</span>
            </div>
            <span className="small">Brand: NEXTGEN home solutions</span>
          </div>

          <div className="panelBody">
            <div className="grid2">
              <div>
                <div className="label">Upload photo(s) — room, exterior, or whole house set</div>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const fs = e.target.files;
                    if (fs) onUpload(fs);
                  }}
                />
                <div style={{ height: 10 }} />
                <CameraCapture onCapture={(d) => {
                  setImages(prev => [d, ...prev].slice(0, 12));
                  setVariants([]); setEstimate(null); setError(null); setActiveImageIdx(0);
                }} />

                {images.length ? (
                  <>
                    <div className="hr" />
                    <div className="label">Image set</div>
                    <div className="row">
                      {images.map((im, idx) => (
                        <button
                          key={idx}
                          className="btn"
                          style={{ padding: 6, opacity: idx === activeImageIdx ? 1 : 0.7 }}
                          onClick={() => { setActiveImageIdx(idx); setVariants([]); setActiveVariant(""); }}
                          title={`Image ${idx + 1}`}
                        >
                          <img src={im} alt={`thumb ${idx+1}`} style={{ width: 70, height: 48, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }} />
                        </button>
                      ))}
                    </div>
                    <div className="small" style={{ marginTop: 8 }}>
                      Tip: upload multiple angles for “whole house” visualization. Rendering uses the selected thumbnail.
                    </div>
                  </>
                ) : null}
              </div>

              <div>
                <div className="label">Project type</div>
                <select className="select" value={projectType} onChange={(e) => setProjectType(e.target.value as any)}>
                  <option>Kitchen</option>
                  <option>Bathroom</option>
                  <option>Basement</option>
                  <option>Exterior</option>
                  <option>Other</option>
                </select>

                <div style={{ height: 10 }} />

                <div className="label">Style direction</div>
                <select className="select" value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option>Modern</option>
                  <option>Transitional</option>
                  <option>Farmhouse</option>
                  <option>Contemporary</option>
                  <option>Traditional</option>
                  <option>Luxury</option>
                </select>

                <div style={{ height: 10 }} />

                <div className="grid2">
                  <div>
                    <div className="label">Quality</div>
                    <select className="select" value={quality} onChange={(e) => setQuality(e.target.value as any)}>
                      <option>Good</option>
                      <option>Better</option>
                      <option>Best</option>
                    </select>
                  </div>
                  <div>
                    <div className="label">Approx. size (sqft)</div>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={roomSizeSqft}
                      onChange={(e) => setRoomSizeSqft(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hr" />

            <div className="label">Describe your finished results</div>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Keep the layout. White shaker cabinets, quartz counters, warm oak LVP, matte black fixtures, brighter lighting..."
            />

            <div className="hr" />

            <div className="label">Preview</div>
            {activeImage ? (
              <img className="preview" src={activeImage} alt="Preview" />
            ) : (
              <div className="small">Upload or capture an image to begin.</div>
            )}

            {promptSummary ? (
              <div style={{ marginTop: 10 }} className="small">
                <strong>Render prompt summary:</strong> {promptSummary}
              </div>
            ) : null}

            {variants.length ? (
              <div className="row" style={{ marginTop: 10 }}>
                {variants.map(v => (
                  <button
                    key={v.id}
                    className="btn"
                    style={{ opacity: v.id === activeVariant ? 1 : 0.72 }}
                    onClick={() => setActiveVariant(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="hr" />

            <div className="row">
              <button className="btn primary" onClick={getEstimate} disabled={estimating}>
                {estimating ? "Estimating..." : "Get an estimate"}
              </button>
              <span className="small">Template-based line items + hidden 35% markup.</span>
            </div>

            {error ? <div className="small" style={{ marginTop: 10 }}>Error: {error}</div> : null}

            {estimate ? (
              <div style={{ marginTop: 12 }}>
                <div className="label">Estimate range</div>
                <div className="row">
                  <span className="pill">Low: ${estimate.range.low.toLocaleString()}</span>
                  <span className="pill">High: ${estimate.range.high.toLocaleString()}</span>
                  <span className="pill">Target: ${estimate.total.toLocaleString()}</span>
                </div>
                <div className="hr" />
                <div className="label">Line items</div>
                <div className="productList">
                  {estimate.items.map((it: any, idx: number) => (
                    <div key={idx} className="product">
                      <div className="pill">{idx + 1}</div>
                      <div>
                        <div className="name">{it.label}</div>
                        <div className="meta">${Number(it.cost).toLocaleString()}</div>
                      </div>
                      <div className="pill">${Number(it.cost).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="hr" />
                <div className="small">
                  {estimate.notes?.map((n: string, i: number) => <div key={i}>• {n}</div>)}
                </div>

                <div className="hr" />
                <LeadCapture consultUrl={consultUrl} onSubmit={saveProject} />
              </div>
            ) : null}
          </div>
        </section>

        {/* RIGHT: Products + assistant */}
        <section className="panel">
          <div className="panelHeader">
            <div className="row">
              <span className="pill">Product palette</span>
              <span className="pill">Curated (MVP)</span>
            </div>
            <span className="small">Swap in Affiliate feed later</span>
          </div>
          <div className="panelBody">
            {!catalog ? (
              <div className="small">Loading products...</div>
            ) : (
              <ProductPalette catalog={catalog} selected={selectedProducts} onChange={setSelectedProducts} />
            )}

            <div className="hr" />

            <AiAssistant
              projectType={projectType}
              style={style}
              description={description}
              selectedProducts={selectedProducts}
              onSuggestionClick={addSuggestionToDescription}
            />
          </div>
        </section>
      </main>

      <div className="footerNote">
        Concept visualization tool (MVP). Renders are illustrative. Final scope/pricing requires field verification.
      </div>
    </div>
  );
}
