import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ROLES = ["owner", "administrator", "founder", "cfo", "analyst", "consultant", "finance_manager", "viewer"] as const;
const schema = z.object({ orgId: z.string().uuid(), email: z.string().email(), role: z.enum(ROLES) });

/** Adds an existing CreModelAI user to the caller's organization. Caller must be owner/administrator. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { orgId, email, role } = parsed.data;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: me } = await supabase.from("organization_members").select("role").eq("org_id", orgId).eq("user_id", auth.user.id).maybeSingle();
  if (!me || !["owner", "administrator"].includes(me.role)) return NextResponse.json({ error: "Only owners and administrators can add members." }, { status: 403 });
  if (role === "owner" && me.role !== "owner") return NextResponse.json({ error: "Only an owner can add another owner." }, { status: 403 });
  try {
    const admin = createServiceClient();
    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
      if (data.users.length < 200) break;
    }
    if (!userId) return NextResponse.json({ error: "No account with that email yet. Ask them to sign up first, then add them." }, { status: 404 });
    const { error } = await admin.from("organization_members").upsert({ org_id: orgId, user_id: userId, role });
    if (error) throw error;
    await admin.from("audit_logs").insert({ org_id: orgId, user_id: auth.user.id, action: "member.added", entity: "member", entity_id: userId, detail: { role } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not add member" }, { status: 500 });
  }
}
