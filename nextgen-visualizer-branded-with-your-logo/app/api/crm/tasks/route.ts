import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase";
import { requireAdminFromRequest } from "../../../../lib/adminAuth";

export async function POST(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { lead_id, title, notes, due_at } = body || {};
    if (!lead_id || !title) return NextResponse.json({ error: "Missing lead_id or title" }, { status: 400 });

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("nextgen_visualizer_tasks")
      .insert({ lead_id, title, notes: notes ?? null, due_at: due_at ?? null })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to add task", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { id, completed } = body || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("nextgen_visualizer_tasks")
      .update({ completed: !!completed })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to update task", details: e?.message ?? String(e) }, { status: 500 });
  }
}
