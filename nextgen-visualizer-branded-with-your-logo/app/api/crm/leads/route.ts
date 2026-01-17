import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase";
import { requireAdminFromRequest } from "../../../../lib/adminAuth";

function autoFollowUpISO(status: string) {
  const now = new Date();
  const addHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
  const addDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString();

  switch (status) {
    case "New":
      return addHours(24);
    case "Contacted":
      return addDays(2);
    case "Qualified":
      return addDays(3);
    case "Estimate Sent":
      return addHours(24);
    case "Scheduled":
      return addDays(7);
    case "Won":
    case "Lost":
      return null;
    default:
      return addDays(2);
  }
}

export async function GET(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const status = (url.searchParams.get("status") || "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit") || "200"), 500);

    const sb = supabaseServer();
    let query = sb
      .from("nextgen_visualizer_projects")
      .select(
        "id, created_at, lead_name, lead_email, lead_phone, lead_timeline, project_type, style, quality, room_size_sqft, status, source, assigned_to, next_follow_up_at, last_contacted_at, estimate"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);
    if (q) query = query.or(`lead_name.ilike.%${q}%,lead_email.ilike.%${q}%,lead_phone.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ leads: data ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load leads", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminFromRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { id, status, assigned_to, next_follow_up_at, tags } = body || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const sb = supabaseServer();

    const current = await sb.from("nextgen_visualizer_projects").select("status, next_follow_up_at").eq("id", id).single();
    const prevStatus = current.data?.status || null;
    const prevFollow = current.data?.next_follow_up_at || null;

    let follow: any = next_follow_up_at ?? undefined;
    const statusChanged = !!status && status !== prevStatus;
    const nextStatus = status ?? prevStatus ?? "New";

    // Automation: auto follow-up on status change (only if no follow-up exists yet and none provided)
    if (statusChanged && (next_follow_up_at === null || next_follow_up_at === undefined) && !prevFollow) {
      follow = autoFollowUpISO(nextStatus);
    }

    const { data, error } = await sb
      .from("nextgen_visualizer_projects")
      .update({
        status: status ?? undefined,
        assigned_to: assigned_to ?? undefined,
        next_follow_up_at: follow,
        last_contacted_at: (body as any)?.last_contacted_at ?? undefined,
        tags: tags ?? undefined,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to update lead", details: e?.message ?? String(e) }, { status: 500 });
  }
}
