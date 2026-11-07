"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Evidence, Panel } from "./ui";
import type { Analysis } from "@/lib/ai/agents";

const AGENT_LIST = [
  ["business_model_analyst", "Business Model Analyst"],
  ["startup_viability", "Startup Viability"],
  ["financial_planning", "Financial Planning"],
  ["pricing_intelligence", "Pricing Intelligence"],
  ["funding_intelligence", "Funding Intelligence"],
  ["executive_reporting", "Executive Summary"],
] as const;

export async function callAi(body: { agent: string; modelId: string; question?: string; scenarioResults?: unknown }) {
  const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "AI request failed");
  return json.result;
}

export function AnalysisView({ a, modelId, orgId }: { a: Analysis; modelId: string | null; orgId: string | null }) {
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  async function addAction(i: number) {
    if (!modelId || !orgId) return;
    const r = a.recommendations[i];
    const { error } = await createClient().from("recommended_actions").insert({ org_id: orgId, model_id: modelId, title: r.title, description: r.rationale, priority: r.priority, source: "ai" });
    if (!error) setSaved((s) => ({ ...s, [i]: true }));
  }
  const sev = { info: "border-line", warning: "border-gold", risk: "border-bad" } as const;
  return (
    <div className="fade-in space-y-4">
      <div className="rounded-lg bg-cream p-4 text-sm"><Evidence kind="interpretation" /><p className="mt-2 leading-relaxed">{a.summary}</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        {a.findings.map((f, i) => (
          <div key={i} className={`card border-l-4 p-3 ${sev[f.severity]}`}>
            <div className="flex items-center justify-between gap-2"><strong className="text-sm">{f.title}</strong><Evidence kind={f.evidence} /></div>
            <p className="mt-1 text-sm text-muted">{f.detail}</p>
          </div>
        ))}
      </div>
      {a.recommendations.length > 0 && (
        <div>
          <h4 className="mb-2 font-display font-bold">Recommended next steps</h4>
          <ul className="space-y-2">
            {a.recommendations.map((r, i) => (
              <li key={i} className="card flex items-start justify-between gap-3 p-3 text-sm">
                <div><strong>{r.title}</strong> <span className="tag tag-assume">{r.priority}</span><p className="text-muted">{r.rationale}</p></div>
                {modelId && <button className="btn btn-ghost shrink-0" disabled={saved[i]} onClick={() => addAction(i)}>{saved[i] ? "Added" : "Add to actions"}</button>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">AI never changes your saved assumptions. Recommendations become tasks only when you add them.</p>
        </div>
      )}
      {a.missingInformation.length > 0 && (
        <div><h4 className="mb-1 font-display font-bold">Missing information</h4><ul className="list-disc pl-5 text-sm text-muted">{a.missingInformation.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
      )}
      <p className="text-xs text-muted">{a.limitations}</p>
    </div>
  );
}

export function AiPanel({ modelId, orgId, scenarioResults }: { modelId: string | null; orgId: string | null; scenarioResults?: unknown }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<{ agent: string; a: Analysis } | null>(null);

  async function run(agent: string) {
    if (!modelId) return;
    setBusy(agent); setError(null);
    try { setOut({ agent, a: await callAi({ agent, modelId, scenarioResults: agent === "scenario_analysis" ? scenarioResults : undefined }) }); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }
  return (
    <Panel title="AI analysis" note="Gemini interprets your calculated results. It never produces the numbers and never edits your assumptions. Results are saved to AI Insights. Save your model first so the AI reads the latest saved version.">
      {!modelId ? (
        <p className="rounded-lg bg-cream p-4 text-sm">AI analysis needs a saved model in your account. Sign up to save this model and run the analysts. The demo calculates everything locally.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {[...AGENT_LIST, ["scenario_analysis", "Scenario Analysis"] as const].map(([k, label]) => (
            <button key={k} className="btn btn-ghost" disabled={!!busy} onClick={() => run(k)}>
              {busy === k ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {label}
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-red-50 p-3 text-sm text-bad">{error}</p>}
      {out && <div className="mt-5"><AnalysisView a={out.a} modelId={modelId} orgId={orgId} /></div>}
    </Panel>
  );
}
