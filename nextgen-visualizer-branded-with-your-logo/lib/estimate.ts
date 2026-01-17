import { z } from "zod";

export const EstimateRequestSchema = z.object({
  projectType: z.enum(["Kitchen", "Bathroom", "Basement", "Exterior", "Other"]),
  roomSizeSqft: z.number().min(1).max(10000),
  quality: z.enum(["Good", "Better", "Best"]).default("Better"),
  selectedProducts: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    brand: z.string(),
    price: z.number(),
    unit: z.enum(["each","sqft","gallon"]),
    image: z.string(),
    qty: z.number().min(0)
  })).default([]),
});

export type EstimateRequest = z.infer<typeof EstimateRequestSchema>;

type LineItem = { label: string; cost: number; note?: string };

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

function sum(items: LineItem[]) {
  return items.reduce((s, x) => s + x.cost, 0);
}

/**
 * Template-based residential estimating (MVP).
 * Tune these values using your historical job data.
 */
export function buildEstimate(req: EstimateRequest) {
  const sqft = req.roomSizeSqft;

  const qMult = req.quality === "Good" ? 0.9 : req.quality === "Better" ? 1.0 : 1.15;

  // Material cost from selected products (palette)
  const materials = req.selectedProducts.reduce((s, p) => s + (p.qty || 0) * p.price, 0);

  // Baseline labor/subs — MA oriented (rough starting point)
  const basePerSqft: Record<EstimateRequest["projectType"], number> = {
    Kitchen: 255,
    Bathroom: 315,
    Basement: 90,
    Exterior: 70,
    Other: 135,
  };

  const base = basePerSqft[req.projectType] * sqft * qMult;

  // Split baseline into realistic buckets per project type
  const templates: Record<EstimateRequest["projectType"], Array<{ label: string; pct: number; note?: string }>> = {
    Kitchen: [
      { label: "Demo & protection", pct: 0.08 },
      { label: "Rough carpentry", pct: 0.10 },
      { label: "Electrical (rough + trim)", pct: 0.12 },
      { label: "Plumbing (rough + trim)", pct: 0.10 },
      { label: "Drywall & paint", pct: 0.10 },
      { label: "Cabinet install", pct: 0.12 },
      { label: "Counters install (labor)", pct: 0.06 },
      { label: "Flooring install (labor)", pct: 0.08 },
      { label: "Tile / backsplash labor", pct: 0.08 },
      { label: "Finish trim & punch list", pct: 0.10 },
      { label: "Cleanup & haul-away", pct: 0.06 },
    ],
    Bathroom: [
      { label: "Demo & protection", pct: 0.10 },
      { label: "Framing / carpentry", pct: 0.10 },
      { label: "Plumbing (rough + trim)", pct: 0.16 },
      { label: "Electrical (rough + trim)", pct: 0.10 },
      { label: "Waterproofing system labor", pct: 0.10 },
      { label: "Tile labor", pct: 0.16 },
      { label: "Drywall & paint", pct: 0.08 },
      { label: "Vanity / fixture install", pct: 0.10 },
      { label: "Glass / accessories allowance", pct: 0.04 },
      { label: "Cleanup & haul-away", pct: 0.06 },
    ],
    Basement: [
      { label: "Demo / prep", pct: 0.08 },
      { label: "Framing & insulation", pct: 0.18 },
      { label: "Electrical", pct: 0.14 },
      { label: "Plumbing (if needed)", pct: 0.08 },
      { label: "Drywall & paint", pct: 0.18 },
      { label: "Flooring labor", pct: 0.14 },
      { label: "Doors / trim labor", pct: 0.10 },
      { label: "Cleanup & haul-away", pct: 0.10 },
    ],
    Exterior: [
      { label: "Demo / prep", pct: 0.10 },
      { label: "Flashing / weather barrier labor", pct: 0.14 },
      { label: "Siding labor", pct: 0.24 },
      { label: "Windows/doors labor (if applicable)", pct: 0.10 },
      { label: "Trim labor", pct: 0.14 },
      { label: "Paint / touch-ups", pct: 0.10 },
      { label: "Cleanup & haul-away", pct: 0.18 },
    ],
    Other: [
      { label: "Demo & prep", pct: 0.10 },
      { label: "Rough work", pct: 0.30 },
      { label: "Finish work", pct: 0.40 },
      { label: "Cleanup & haul-away", pct: 0.20 },
    ],
  };

  const items: LineItem[] = templates[req.projectType].map(t => ({
    label: t.label,
    cost: base * t.pct,
    note: t.note,
  }));

  // Add explicit materials selection as separate line item
  items.splice(1, 0, { label: "Materials (selected from palette)", cost: materials });

  // Add allowances (permits, delivery, dumpster)
  const permits = req.projectType === "Exterior" ? 650 : 1250;
  const dumpster = req.projectType === "Basement" ? 750 : 1150;
  const delivery = 450;

  items.push({ label: "Permits allowance", cost: permits });
  items.push({ label: "Disposal / dumpster", cost: dumpster });
  items.push({ label: "Delivery / logistics", cost: delivery });

  const subtotal = sum(items);

  // Hidden markup requirement
  const markupRate = 0.35;
  const total = subtotal * (1 + markupRate);

  // Proposal range ±8%
  const low = total * 0.92;
  const high = total * 1.08;

  return {
    items: items.map(i => ({ label: i.label, cost: Math.round(i.cost) })),
    subtotal: Math.round(subtotal),
    markupRate,
    total: roundTo(total, 100),
    range: { low: roundTo(low, 100), high: roundTo(high, 100) },
    notes: [
      "Automated estimate for planning only; field verification required.",
      "Final pricing varies by measurements, code needs, and site conditions.",
      "Massachusetts: permit costs and timelines vary by town."
    ],
  };
}
