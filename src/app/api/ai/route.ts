import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { computeModel } from "@/lib/engine/calc";
import { modelInputsSchema } from "@/lib/engine/types";
import { AGENTS, buildContext } from "@/lib/ai/agents";
import { AiUnavailableError, aiConfigured, generateStructured } from "@/lib/ai/gemini";
import { PLANS, type PlanKey } from "@/lib/plans";

export const maxDuration = 60;

const body = z.object({
  agent: z.string(),
  modelId: z.string().uuid(),
  question: z.string().max(2000).optional(),
  scenarioResults: z.unknown().optional(),
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
  const { agent: agentKey, modelId, question, scenarioResults } = parsed.data;
  const agent = AGENTS[agentKey];
  if (!agent) return NextResponse.json({ error: "Unknown agent" }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (limited(auth.user.id)) return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });

  // RLS guarantees the caller can only read models in organizations they belong to.
  const { data: model } = await supabase.from("business_models").select("id, org_id, name, current_version_id").eq("id", modelId).single();
  if (!model?.current_version_id) return NextResponse.json({ error: "Model not found" }, { status: 404 });
  const { data: ver } = await supabase.from("financial_model_versions").select("inputs").eq("id", model.current_version_id).single();
  const inputs = modelInputsSchema.safeParse(ver?.inputs);
  if (!inputs.success) return NextResponse.json({ error: "Saved model has invalid inputs; fix the assumptions first." }, { status: 422 });

  // Plan limits (server-side). Limits are only enforced where configured in src/lib/plans.ts.
  let admin: ReturnType<typeof createServiceClient> | null = null;
  try { admin = createServiceClient(); } catch { admin = null; }
  if (admin) {
    const { data: sub } = await admin.from("subscriptions").select("plan,status").eq("org_id", model.org_id).maybeSingle();
    const plan = (sub?.status === "active" ? sub.plan : "free") as PlanKey;
    const limit = PLANS[plan].limits[agent.usage];
    if (typeof limit === "number") {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: used } = await admin.from("usage_records").select("quantity").eq("org_id", model.org_id).eq("kind", agent.usage).gte("created_at", since);
      const total = (used ?? []).reduce((a, r) => a + r.quantity, 0);
      if (total >= limit) return NextResponse.json({ error: `Your plan limit for ${agent.usage} has been reached.` }, { status: 402 });
    }
  }

  if (!aiConfigured()) {
    return NextResponse.json({ error: "AI is not configured (GEMINI_API_KEY missing). Calculations, scenarios and reports still work." }, { status: 503 });
  }

  // Numbers always come from the deterministic engine, never from the client or the model.
  const result = computeModel(inputs.data);
  const context = buildContext(model.name, inputs.data, result, scenarioResults);
  const prompt = `${agent.instruction}\n\n${question ? `User question: ${question}\n\n` : ""}Model data (JSON):\n${context}`;

  const log = async (status: "success" | "error", error?: string) => {
    if (!admin) return;
    await admin.from("ai_agent_runs").insert({ org_id: model.org_id, user_id: auth.user!.id, model_id: modelId, agent: agent.key, status, error: error ?? null, duration_ms: Date.now() - t0 });
    if (status === "success") await admin.from("usage_records").insert({ org_id: model.org_id, user_id: auth.user!.id, kind: agent.usage });
  };

  try {
    const out = await generateStructured(prompt, agent.schema);
    await log("success");
    if (agent.key !== "ask" && agent.key !== "business_plan") {
      await supabase.from("ai_insights").insert({ org_id: model.org_id, model_id: modelId, agent: agent.key, kind: "analysis", title: agent.label, body: out });
    }
    return NextResponse.json({ ok: true, agent: agent.key, result: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    await log("error", msg);
    const unavailable = e instanceof AiUnavailableError;
    return NextResponse.json({ error: unavailable ? "The AI service is temporarily unavailable. Your model and calculations are unaffected." : msg }, { status: unavailable ? 503 : 502 });
  }
}
