import { supabaseServer } from "./supabase";

export async function requireAdminFromRequest(
  req: Request
): Promise<
  | { ok: true; email: string }
  | { ok: false; status: number; error: string }
> {
  const allow = (process.env.ADMIN_ALLOWLIST_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1];

  if (!token) {
    return { ok: false, status: 401, error: "Missing Authorization Bearer token" };
  }

  try {
    const sb = supabaseServer();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) {
      return { ok: false, status: 401, error: "Invalid session" };
    }
    const email = (data.user.email || "").toLowerCase();
    if (allow.length && !allow.includes(email)) {
      return { ok: false, status: 403, error: "Email not allowed" };
    }
    return { ok: true, email };
  } catch (e: any) {
    return { ok: false, status: 500, error: e?.message ?? String(e) };
  }
}
