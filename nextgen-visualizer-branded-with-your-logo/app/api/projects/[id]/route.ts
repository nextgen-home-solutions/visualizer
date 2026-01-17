import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase";

function hasSupabaseEnv() {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }
    const { id } = await params;
    const sb = supabaseServer();
    const { data, error } = await sb.from("nextgen_visualizer_projects").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ project: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }
    const { id } = await params;
    const sb = supabaseServer();
    const { error } = await sb.from("nextgen_visualizer_projects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
