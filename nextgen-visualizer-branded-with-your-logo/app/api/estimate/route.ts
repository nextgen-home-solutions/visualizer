import { NextResponse } from "next/server";
import { EstimateRequestSchema, buildEstimate } from "../../../lib/estimate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = EstimateRequestSchema.parse(body);
    const estimate = buildEstimate(parsed);
    return NextResponse.json(estimate, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request", details: err?.message ?? String(err) }, { status: 400 });
  }
}
