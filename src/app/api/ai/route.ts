import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CADENCES, computeMetrics } from "@/lib/revenue/analytics";
import { deriveIcp, loadSales } from "@/lib/revenue/load";
import { AGENTS } from "@/lib/ai/agents";
import { AiUnavailableError, aiConfigured, generateStructured } from "@/lib/ai/gemini";
import { PLANS, type PlanKey } from "@/lib/plans";

export const maxDuration = 60;

const body = z.object({
  agent: z.string(),
  cadence: z.enum(CADENCES).optional(),
  question: z.string().max(2000).optional(),
  dealId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  candidateIds: z.array(z.string().uuid()).max(25).optional(),
});

// Simple per-user, per-instance rate limit (10 requests / minute).
const hits = new Map<string, number[]>();
function limited(user: string) {
  const now = Date.now();
  const recent = (hits.get(user) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(user, recent);
  return recent.length > 10;
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const p = parsed.data;
  const agent = AGENTS[p.agent];
  if (!agent) return NextResponse.json({ error: "Unknown agent" }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (limited(auth.user.id)) return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });

  const { data: mem } = await supabase.from("organization_members").select("org_id, role").eq("user_id", auth.user.id).order("created_at").limit(1).maybeSingle();
  if (!mem) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const orgId = mem.org_id as string;
  const canEdit = ["owner", "administrator", "founder", "cfo", "analyst", "consultant", "finance_manager"].includes(mem.role);
  if (!canEdit) return NextResponse.json({ error: "Your role is view-only." }, { status: 403 });

  let admin: ReturnType<typeof createServiceClient> | null = null;
  try { admin = createServiceClient(); } catch { admin = null; }
  if (admin) {
    const { data: sub } = await admin.from("subscriptions").select("plan,status").eq("org_id", orgId).maybeSingle();
    const plan = (sub?.status === "active" ? sub.plan : "free") as PlanKey;
    const limit = PLANS[plan].limits[agent.usage];
    if (typeof limit === "number") {
      const since = new Date(new Date().getTime() - 30 * 86400_000).toISOString();
      const { data: used } = await admin.from("usage_records").select("quantity").eq("org_id", orgId).eq("kind", agent.usage).gte("created_at", since);
      if ((used ?? []).reduce((a, r) => a + r.quantity, 0) >= limit) return NextResponse.json({ error: `Your plan limit for this feature has been reached.` }, { status: 402 });
    }
  }

  // ---- build context from the caller's own data. All numbers come from the deterministic engine. ----
  let context: Record<string, unknown> = {};
  let briefingMetrics: ReturnType<typeof computeMetrics> | null = null;
  try {
    if (agent.key === "briefing" || agent.key === "ask") {
      const { rows, truncated } = await loadSales(supabase, orgId);
      const cadence = p.cadence ?? "monthly";
      const metrics = computeMetrics(rows, cadence);
      briefingMetrics = metrics;
      if (rows.length === 0) return NextResponse.json({ error: "Upload sales data first. There is nothing to analyse yet." }, { status: 422 });
      const { data: deals } = await supabase.from("pipeline_deals").select("name,account,owner,stage,value,expected_close,follow_up_on,last_contact").eq("org_id", orgId).not("stage", "in", "(won,lost)").limit(60);
      context = { metrics: slimMetrics(metrics), openPipeline: deals ?? [], dataNote: truncated ? "Only the first 50,000 sales rows were analysed." : undefined };
      if (agent.key === "ask") context.question = p.question;
    } else if (agent.key === "follow_up") {
      const { data: deal } = await supabase.from("pipeline_deals").select("*").eq("id", p.dealId ?? "").eq("org_id", orgId).maybeSingle();
      if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      const { data: convs } = await supabase.from("conversations").select("title,analysis,created_at").eq("deal_id", deal.id).order("created_at", { ascending: false }).limit(3);
      context = { today: new Date().toISOString().slice(0, 10), deal, recentConversations: convs ?? [] };
    } else if (agent.key === "conversation") {
      const { data: conv } = await supabase.from("conversations").select("id,title,transcript").eq("id", p.conversationId ?? "").eq("org_id", orgId).maybeSingle();
      if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      context = { title: conv.title, transcript: String(conv.transcript).slice(0, 30000) };
    } else if (agent.key === "lead_finder") {
      const { rows } = await loadSales(supabase, orgId);
      if (rows.length === 0) return NextResponse.json({ error: "Upload sales data first so the ideal customer can be learned from who already buys." }, { status: 422 });
      const { data: cands } = await supabase.from("lead_candidates").select("id,name,industry,region,notes").eq("org_id", orgId).in("id", p.candidateIds ?? []);
      if (!cands?.length) return NextResponse.json({ error: "Select at least one candidate." }, { status: 422 });
      context = { icp: deriveIcp(rows), candidates: cands };
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not load data" }, { status: 500 });
  }

  const log = async (status: "success" | "error", error?: string) => {
    if (!admin) return;
    await admin.from("ai_agent_runs").insert({ org_id: orgId, user_id: auth.user!.id, agent: agent.key, status, error: error ?? null, duration_ms: Date.now() - t0 });
    if (status === "success") await admin.from("usage_records").insert({ org_id: orgId, user_id: auth.user!.id, kind: agent.usage });
  };

  // The briefing is saved with its deterministic metrics even when AI is unavailable.
  const saveBriefing = async (content: unknown) => {
    if (!briefingMetrics) return null;
    const { data } = await supabase.from("briefings").insert({ org_id: orgId, cadence: briefingMetrics.cadence, period_start: briefingMetrics.periodStart, period_end: briefingMetrics.periodEnd, metrics: briefingMetrics, content, created_by: auth.user!.id }).select("id").single();
    return data?.id ?? null;
  };

  if (!aiConfigured()) {
    if (agent.key === "briefing") { const id = await saveBriefing(null); return NextResponse.json({ ok: true, aiUnavailable: true, briefingId: id, message: "AI is not configured. The calculated briefing was saved without a written narrative." }); }
    return NextResponse.json({ error: "AI is not configured (GEMINI_API_KEY missing)." }, { status: 503 });
  }

  const prompt = `${agent.instruction}\n\nData (JSON):\n${JSON.stringify(context)}`;
  try {
    const out = await generateStructured(prompt, agent.schema);
    await log("success");
    let briefingId: string | null = null;
    if (agent.key === "briefing") briefingId = await saveBriefing(out);
    if (agent.key === "conversation") await supabase.from("conversations").update({ analysis: out }).eq("id", p.conversationId!);
    if (agent.key === "lead_finder") {
      for (const s of (out as { scores: { id: string; score: number; reasoning: string }[] }).scores) {
        if ((p.candidateIds ?? []).includes(s.id)) await supabase.from("lead_candidates").update({ score: Math.round(s.score), reasoning: s.reasoning, scored_at: new Date().toISOString() }).eq("id", s.id).eq("org_id", orgId);
      }
    }
    return NextResponse.json({ ok: true, agent: agent.key, result: out, briefingId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    await log("error", msg);
    if (agent.key === "briefing") { const id = await saveBriefing(null); return NextResponse.json({ ok: true, aiUnavailable: true, briefingId: id, message: "The AI service was unavailable. The calculated briefing was saved without a written narrative; you can regenerate it later." }); }
    const unavailable = e instanceof AiUnavailableError;
    return NextResponse.json({ error: unavailable ? "The AI service is temporarily unavailable. Your data and calculated reports are unaffected." : msg }, { status: unavailable ? 503 : 502 });
  }
}

/** Keeps the prompt small: top segments only. */
function slimMetrics(m: ReturnType<typeof computeMetrics>) {
  const top = (a: unknown[]) => a.slice(0, 10);
  return { ...m, monthly: m.monthly.slice(-18), segments: { customer: top(m.segments.customer), product: top(m.segments.product), region: top(m.segments.region), rep: top(m.segments.rep) }, decliningCustomers: top(m.decliningCustomers) };
}
