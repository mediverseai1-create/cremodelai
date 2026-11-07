"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import type { ModelInputs, ModelResult } from "@/lib/engine/types";
import { PLAN_SECTIONS } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/client";
import { money, pct } from "@/lib/format";
import { callAi } from "./AiPanel";
import { Panel } from "./ui";

const FINANCIAL = new Set(["Financial assumptions", "Financial projections", "Break-even analysis", "Funding requirements"]);

/** Financial sections are generated from the live model every render, so they can never contradict it. */
export function financialSection(title: string, inputs: ModelInputs, r: ModelResult): string {
  const c = inputs.currency;
  switch (title) {
    case "Financial assumptions":
      return [
        `Planning horizon: ${inputs.horizonMonths} months. Currency: ${c}. Opening cash: ${money(inputs.openingCash, c)}. Customer payment terms: ${inputs.receivablesDays} days.`,
        ...inputs.products.map((p) => `• ${p.name} (${p.kind}): price ${money(p.price, c)}, direct cost ${money(p.unitCost, c)}/unit, ${p.startVolume} units in month 1, ${p.monthlyGrowthPct}% monthly growth.`),
        `• Fixed costs: ${money(inputs.fixedCosts.reduce((a, x) => a + x.monthly, 0), c)}/month at launch. Planned staff: ${inputs.staff.reduce((a, s) => a + s.headcount, 0)}.`,
        "These are user-provided assumptions, not verified market data.",
      ].join("\n");
    case "Financial projections":
      return [
        ...r.years.map((y) => `${y.label}: revenue ${money(y.revenue, c)}, gross profit ${money(y.grossProfit, c)}, operating profit ${money(y.operatingProfit, c)}, closing cash ${money(y.closingCash, c)}.`),
        `Gross margin over the horizon: ${pct(r.grossMarginPct)}; operating margin: ${pct(r.operatingMarginPct)}.`,
        "Projections are estimates based on the stated assumptions, not audited accounts.",
      ].join("\n");
    case "Break-even analysis":
      return `At month ${r.breakEven.runRateMonth} run-rate, monthly fixed costs are ${money(r.breakEven.monthlyFixedCosts, c)}. Break-even revenue is ${money(r.breakEven.breakEvenRevenue, c)} per month (${r.breakEven.breakEvenUnits ?? "—"} units). First operating-profit month: ${r.breakEven.firstProfitableMonth ?? "not reached within the horizon"}. Margin of safety: ${pct(r.breakEven.marginOfSafetyPct)}.`;
    case "Funding requirements":
      return `Startup/investment spend: ${money(r.funding.startupCosts, c)}. Planned funding: ${money(r.funding.totalFundingPlanned, c)}. Lowest projected cash balance: ${money(r.funding.minClosingCash, c)}${r.funding.fundingGap > 0 ? `, a projected funding gap of ${money(r.funding.fundingGap, c)} (cash first goes negative in month ${r.funding.runwayMonths})` : ", with no funding gap projected under these assumptions"}.`;
    default:
      return "";
  }
}

export function PlanPanel({ inputs, result, modelId, orgId, canEdit }: { inputs: ModelInputs; result: ModelResult; modelId: string | null; orgId: string | null; canEdit: boolean }) {
  const [text, setText] = useState<Record<string, string>>({});
  const [planId, setPlanId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) return;
    const sb = createClient();
    sb.from("business_plans").select("id").eq("model_id", modelId).order("created_at", { ascending: false }).limit(1).maybeSingle().then(async ({ data }) => {
      if (!data) return;
      setPlanId(data.id);
      const { data: secs } = await sb.from("business_plan_sections").select("title,body").eq("plan_id", data.id);
      setText(Object.fromEntries((secs ?? []).map((s) => [s.title, s.body])));
    });
  }, [modelId]);

  const sections = useMemo(() => PLAN_SECTIONS.map((t) => ({ t, fin: FINANCIAL.has(t), body: FINANCIAL.has(t) ? financialSection(t, inputs, result) : text[t] ?? "" })), [text, inputs, result]);

  async function draft() {
    if (!modelId) return;
    setBusy(true); setMsg(null);
    try {
      const out = await callAi({ agent: "business_plan", modelId });
      const next = { ...text };
      for (const s of out.sections as { title: string; body: string }[]) if (PLAN_SECTIONS.includes(s.title) && !FINANCIAL.has(s.title)) next[s.title] = s.body;
      setText(next); setMsg("AI draft added to empty and existing narrative sections. Review and edit before saving; financial sections come from your model.");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  async function save() {
    if (!modelId || !orgId) return;
    const sb = createClient();
    let id = planId;
    if (!id) {
      const { data, error } = await sb.from("business_plans").insert({ org_id: orgId, model_id: modelId }).select("id").single();
      if (error) { setMsg(error.message); return; }
      id = data.id; setPlanId(id);
    } else await sb.from("business_plan_sections").delete().eq("plan_id", id);
    const rows = PLAN_SECTIONS.map((t, i) => ({ org_id: orgId, plan_id: id!, position: i, title: t, body: sections[i].body, source: FINANCIAL.has(t) ? "model" : "user" }));
    const { error } = await sb.from("business_plan_sections").insert(rows);
    setMsg(error ? error.message : "Business plan saved.");
  }

  return (
    <Panel title="Business plan builder" note="Financial sections are generated live from your financial model and update when you change assumptions. Narrative sections are yours to write or draft with AI; nothing is invented about your market."
      actions={<div className="flex gap-2">
        <button className="btn btn-ghost" disabled={!modelId || busy} onClick={draft}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft with AI</button>
        <button className="btn btn-primary" disabled={!modelId || !canEdit} onClick={save}><Save size={14} /> Save plan</button>
        <button className="btn btn-ghost" onClick={() => window.print()}>Print / PDF</button>
      </div>}>
      {!modelId && <p className="mb-4 rounded-lg bg-cream p-3 text-sm">Demo mode: financial sections are live; saving and AI drafting require an account.</p>}
      {msg && <p role="status" className="mb-3 text-sm text-muted">{msg}</p>}
      <div className="space-y-5">
        {sections.map((s, i) => (
          <div key={s.t}>
            <h4 className="mb-1 font-display font-bold">{i + 1}. {s.t} {s.fin && <span className="tag tag-calc ml-2">Linked to model</span>}</h4>
            {s.fin ? <pre className="whitespace-pre-wrap rounded-lg bg-cream p-3 font-sans text-sm leading-relaxed">{s.body}</pre> : (
              <textarea className="input" rows={4} placeholder="Write this section, or draft it with AI." value={s.body} onChange={(e) => setText({ ...text, [s.t]: e.target.value })} />
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
