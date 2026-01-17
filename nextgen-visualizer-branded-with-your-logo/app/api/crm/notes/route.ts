import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase";
import { requireAdminFromRequest } from "../../../../lib/adminAuth";

export async function POST(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { lead_id, author, body: noteBody } = body || {};
    if (!lead_id || !noteBody) return NextResponse.json({ error: "Missing lead_id or body" }, { status: 400 });

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("nextgen_visualizer_notes")
      .insert({ lead_id, author: author ?? auth.email, body: noteBody })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ note: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to add note", details: e?.message ?? String(e) }, { status: 500 });
  }
}
