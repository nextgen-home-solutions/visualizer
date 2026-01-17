import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase";
import { requireAdminFromRequest } from "../../../../lib/adminAuth";

export async function GET(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("nextgen_visualizer_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load users", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();

    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("nextgen_visualizer_users")
      .insert({ name, email: email || null })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ user: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create user", details: e?.message ?? String(e) }, { status: 500 });
  }
}
