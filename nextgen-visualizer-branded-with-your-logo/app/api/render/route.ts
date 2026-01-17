import { NextResponse } from "next/server";

/**
 * Placeholder image renderer (MVP):
 * - Accepts an uploaded image (as base64 data URL)
 * - Returns the same image as the "rendered" output + a generated prompt summary
 *
 * Later: replace with a real image-gen/inpainting service.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageDataUrl, prompt, selectedProducts, style } = body as {
      imageDataUrl: string;
      prompt: string;
      style: string;
      selectedProducts: { sku: string; name: string }[];
    };

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json({ error: "Missing imageDataUrl" }, { status: 400 });
    }

    const productNames = (selectedProducts ?? []).map(p => p.name).slice(0, 8);
    const promptSummary =
      `Style: ${style || "—"} | ` +
      `Requested: ${prompt || "—"} | ` +
      `Products: ${productNames.length ? productNames.join(", ") : "—"}`;

    // Return original as preview; create 3 variants for UI
    const variants = [
      { id: "v1", label: "Concept A", imageDataUrl },
      { id: "v2", label: "Concept B", imageDataUrl },
      { id: "v3", label: "Concept C", imageDataUrl },
    ];

    return NextResponse.json({ promptSummary, variants }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Render failed", details: err?.message ?? String(err) }, { status: 500 });
  }
}
