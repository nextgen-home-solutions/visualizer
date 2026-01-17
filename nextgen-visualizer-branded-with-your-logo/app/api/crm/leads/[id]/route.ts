import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase";
import { requireAdminFromRequest } from "../../../../../lib/adminAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  try {
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("nextgen_visualizer_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const notes = await sb
      .from("nextgen_visualizer_notes")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    const tasks = await sb
      .from("nextgen_visualizer_tasks")
      .select("*")
      .eq("lead_id", id)
      .order("completed", { ascending: true })
      .order("due_at", { ascending: true });

    return NextResponse.json({ lead: data, notes: notes.data ?? [], tasks: tasks.data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load lead", details: e?.message ?? String(e) }, { status: 500 });
  }
}
