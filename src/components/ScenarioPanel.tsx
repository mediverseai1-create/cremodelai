"use client";
import { useEffect, useMemo, useState } from "react";
import { Copy, Save, Trash2 } from "lucide-react";
import type { ModelInputs } from "@/lib/engine/types";
import { DEFAULT_SCENARIOS, NEUTRAL, compareResults, runScenario, type ScenarioAdjustments } from "@/lib/engine/scenarios";
import { createClient } from "@/lib/supabase/client";
import { money, uid } from "@/lib/format";
import { CompareChart } from "./charts";
import { Field, Panel } from "./ui";

interface Sc { id: string; name: string; adj: ScenarioAdjustments; notes: string; saved: boolean }

const CONTROLS: { key: keyof ScenarioAdjustments; label: string; suffix: string; step?: number }[] = [
  { key: "priceChangePct", label: "Selling price", suffix: "%" },
  { key: "volumeChangePct", label: "Sales volume", suffix: "%" },
  { key: "growthDeltaPts", label: "Monthly growth (± pts)", suffix: "pts", step: 0.5 },
  { key: "variableCostChangePct", label: "Variable costs", suffix: "%" },
  { key: "fixedCostChangePct", label: "Fixed expenses", suffix: "%" },
  { key: "hiringDelayMonths", label: "Hiring delay", suffix: "mo", step: 1 },
  { key: "extraMarketingMonthly", label: "Extra marketing / month", suffix: "$" },
  { key: "capexChangePct", label: "Capital investment", suffix: "%" },
  { key: "fundingChangePct", label: "Funding", suffix: "%" },
  { key: "receivablesDays", label: "Customer payment days", suffix: "days", step: 15 },
];

export function ScenarioPanel({ inputs, modelId, orgId, canEdit, onResultsChange }: {
  inputs: ModelInputs; modelId: string | null; orgId: string | null; canEdit: boolean; onResultsChange: (r: unknown) => void;
}) {
  const [list, setList] = useState<Sc[]>(() => DEFAULT_SCENARIOS.map((s) => ({ id: uid(), name: s.name, adj: s.adj, notes: "", saved: false })));
  const [sel, setSel] = useState(list[0].id);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) return;
    createClient().from("financial_scenarios").select("id,name,adjustments,notes").eq("model_id", modelId).order("created_at").then(({ data }) => {
      if (data?.length) {
        const loaded = data.map((d) => ({ id: d.id as string, name: d.name as string, adj: { ...NEUTRAL, ...(d.adjustments as object) } as ScenarioAdjustments, notes: (d.notes as string) ?? "", saved: true }));
        setList(loaded); setSel(loaded[0].id);
      }
    });
  }, [modelId]);

  const baseRes = useMemo(() => runScenario(inputs, NEUTRAL), [inputs]);
  const results = useMemo(() => list.map((s) => ({ s, r: runScenario(inputs, s.adj) })), [list, inputs]);
  const cur = list.find((s) => s.id === sel) ?? list[0];
  const curRes = results.find((x) => x.s.id === cur.id)!.r;
  const deltas = compareResults(baseRes, curRes);

  useEffect(() => {
    onResultsChange(results.map(({ s, r }) => ({ name: s.name, adjustments: s.adj, totals: r.totals, breakEven: r.breakEven, funding: r.funding })));
  }, [results, onResultsChange]);

  const update = (patch: Partial<Sc>) => setList((l) => l.map((s) => (s.id === cur.id ? { ...s, ...patch, saved: false } : s)));
  const setAdj = (k: keyof ScenarioAdjustments, v: number) => update({ adj: { ...cur.adj, [k]: Number.isNaN(v) ? 0 : v } });

  async function save(s: Sc) {
    if (!modelId || !orgId) { setMsg("Sign in to save scenarios. Demo scenarios stay in this browser tab."); return; }
    const sb = createClient();
    const res = results.find((x) => x.s.id === s.id)!.r;
    const row = { org_id: orgId, model_id: modelId, name: s.name, adjustments: s.adj, notes: s.notes, results: { totals: res.totals, breakEven: res.breakEven, funding: res.funding } };
    const q = s.saved ? sb.from("financial_scenarios").update(row).eq("id", s.id).select("id").single() : sb.from("financial_scenarios").insert(row).select("id").single();
    const { data, error } = await q;
    if (error) { setMsg(error.message); return; }
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, id: data!.id, saved: true } : x)));
    setSel(data!.id); setMsg("Scenario saved.");
  }
  async function remove(s: Sc) {
    if (!window.confirm(`Delete scenario "${s.name}"?`)) return;
    if (s.saved) await createClient().from("financial_scenarios").delete().eq("id", s.id);
    const rest = list.filter((x) => x.id !== s.id);
    setList(rest.length ? rest : [{ id: uid(), name: "New scenario", adj: NEUTRAL, notes: "", saved: false }]);
    setSel((rest[0] ?? list[0]).id);
  }
  const dup = () => { const n = { ...cur, id: uid(), name: `${cur.name} (copy)`, saved: false }; setList([...list, n]); setSel(n.id); };

  const chart = [{ name: "Current model", Revenue: baseRes.totals.revenue, "Operating profit": baseRes.totals.operatingProfit },
    ...results.map(({ s, r }) => ({ name: s.name, Revenue: r.totals.revenue, "Operating profit": r.totals.operatingProfit }))];

  return (
    <div className="space-y-5">
      <Panel title="Scenario planner" note="Adjust assumptions on a scenario; the deterministic engine recalculates instantly. Changes here never alter your saved model. Presets are editable starting points, not forecasts.">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {list.map((s) => (
            <button key={s.id} onClick={() => setSel(s.id)} className={`btn ${s.id === cur.id ? "btn-primary" : "btn-ghost"}`}>{s.name}{!s.saved && modelId ? " •" : ""}</button>
          ))}
          <button className="btn btn-ghost" onClick={dup}><Copy size={14} /> Duplicate</button>
          <button className="btn btn-ghost" onClick={() => { const n = { id: uid(), name: "New scenario", adj: NEUTRAL, notes: "", saved: false }; setList([...list, n]); setSel(n.id); }}>+ New</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Scenario name"><input className="input" value={cur.name} onChange={(e) => update({ name: e.target.value })} /></Field>
          {CONTROLS.map((c) => (
            <Field key={c.key} label={`${c.label} (${c.suffix})`}>
              <input className="input" type="number" step={c.step ?? 1} value={cur.adj[c.key] ?? (c.key === "receivablesDays" ? inputs.receivablesDays : 0)} onChange={(e) => setAdj(c.key, e.target.valueAsNumber)} />
            </Field>
          ))}
        </div>
        <Field label="Notes"><textarea className="input mt-1" rows={2} value={cur.notes} onChange={(e) => update({ notes: e.target.value })} /></Field>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={!canEdit} onClick={() => save(cur)}><Save size={14} /> Save scenario</button>
          <button className="btn btn-danger" onClick={() => remove(cur)}><Trash2 size={14} /> Delete</button>
        </div>
        {msg && <p role="status" className="mt-2 text-sm text-muted">{msg}</p>}
      </Panel>

      <Panel title={`${cur.name} vs current model`} note="All figures are calculated, not AI-generated.">
        <table className="tbl">
          <thead><tr><th>Metric</th><th className="r">Current model</th><th className="r">{cur.name}</th><th className="r">Change</th></tr></thead>
          <tbody>
            {deltas.map((d) => {
              const isMonth = d.metric.includes("month");
              const f = (v: number | null) => (v === null ? "—" : isMonth ? `Month ${v}` : money(v, inputs.currency));
              return (
                <tr key={d.metric}><td>{d.metric}</td><td className="r num">{f(d.base)}</td><td className="r num">{f(d.scenario)}</td>
                  <td className={`r num ${d.delta === null || d.delta === 0 ? "" : (d.metric === "Funding gap" ? d.delta < 0 : d.delta > 0) ? "text-good" : "text-bad"}`}>
                    {d.delta === null ? "—" : isMonth ? `${d.delta > 0 ? "+" : ""}${d.delta} mo` : (d.delta > 0 ? "+" : "") + money(d.delta, inputs.currency)}</td></tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title="All scenarios compared">
        <CompareChart data={chart} currency={inputs.currency} />
      </Panel>
    </div>
  );
}
