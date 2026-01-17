import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase";

function hasSupabaseEnv() {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
    }
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("nextgen_visualizer_projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ projects: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load projects", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
    }
    const body = await req.json();

    const row = {
      id: body.id,
      created_at: body.createdAt,
      lead_name: body.name,
      lead_email: body.email,
      lead_phone: body.phone ?? null,
      lead_address: body.address ?? null,
      lead_timeline: body.timeline ?? null,
      project_type: body.projectType,
      style: body.style,
      quality: body.quality,
      room_size_sqft: body.roomSizeSqft,
      description: body.description ?? null,
      selected_products: body.selectedProducts ?? [],
      images: body.images ?? [],
      variants: body.variants ?? [],
      estimate: body.estimate ?? null,
    };

    const sb = supabaseServer();
    const { data, error } = await sb.from("nextgen_visualizer_projects").upsert(row).select("*").single();
    if (error) throw error;

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to save project", details: e?.message ?? String(e) }, { status: 400 });
  }
}
