"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Download, History, RotateCcw, Save } from "lucide-react";
import { computeModel } from "@/lib/engine/calc";
import { CURRENCIES, type ModelInputs } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/client";
import { download, money, num, pct, toCsv } from "@/lib/format";
import { CashChart, RevenueProfitChart } from "./charts";
import { AiPanel } from "./AiPanel";
import { PlanPanel } from "./PlanPanel";
import { ScenarioPanel } from "./ScenarioPanel";
import { EditableTable, Field, Panel, Stat } from "./ui";

import { TABS, type TabKey } from "@/lib/tabs";

export interface VersionRow { id: string; version_number: number; created_at: string; note: string | null; inputs: ModelInputs }
interface Props {
  demo: boolean; modelId: string | null; orgId: string | null; userId: string | null; canEdit: boolean;
  name: string; initial: ModelInputs; initialTab?: TabKey; versions?: VersionRow[];
}

function changedSections(a: ModelInputs, b: ModelInputs) {
  return (Object.keys(b) as (keyof ModelInputs)[]).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

export default function Workspace({ demo, modelId, orgId, userId, canEdit, name: initialName, initial, initialTab = "profile", versions: initialVersions = [] }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [inputs, setInputs] = useState<ModelInputs>(initial);
  const [saved, setSaved] = useState<ModelInputs>(initial);
  const [name, setName] = useState(initialName);
  const [versions, setVersions] = useState<VersionRow[]>(initialVersions);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scenarioResults, setScenarioResults] = useState<unknown>(null);
  const onScenarioResults = useCallback((r: unknown) => setScenarioResults(r), []);

  const result = useMemo(() => computeModel(inputs), [inputs]);
  const dirty = JSON.stringify(inputs) !== JSON.stringify(saved);
  const c = inputs.currency;
  const hasErrors = result.issues.some((i) => i.severity === "error");
  const patch = (p: Partial<ModelInputs>) => setInputs((s) => ({ ...s, ...p }));
  const num0 = (v: number) => (Number.isNaN(v) ? 0 : v);

  async function saveVersion() {
    if (!modelId || !orgId || !canEdit) return;
    if (hasErrors) { setMsg({ ok: false, text: "Fix the highlighted input errors before saving." }); return; }
    const sb = createClient();
    const next = (versions[0]?.version_number ?? 0) + 1;
    const { data: v, error } = await sb.from("financial_model_versions")
      .insert({ org_id: orgId, model_id: modelId, version_number: next, inputs, created_by: userId }).select("id,version_number,created_at,note,inputs").single();
    if (error || !v) { setMsg({ ok: false, text: error?.message ?? "Save failed" }); return; }
    await sb.from("financial_model_outputs").insert({ version_id: v.id, org_id: orgId, outputs: result });
    await sb.from("business_models").update({ current_version_id: v.id, name, updated_at: new Date().toISOString() }).eq("id", modelId);
    const changes = changedSections(saved, inputs);
    await sb.from("model_change_history").insert({ org_id: orgId, model_id: modelId, user_id: userId, summary: `Saved version ${next}${changes.length ? ` — changed: ${changes.join(", ")}` : ""}`, detail: { changes } });
    setVersions([v as VersionRow, ...versions]); setSaved(inputs);
    setMsg({ ok: true, text: `Saved as version ${next}. Earlier versions are preserved.` });
  }


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {demo && <span className="tag tag-assume mb-1">Demonstration data — not real</span>}
          <input aria-label="Model name" className="block bg-transparent font-display text-2xl font-extrabold outline-none" value={name} disabled={!canEdit && !demo} onChange={(e) => setName(e.target.value)} />
          <p className="text-sm text-muted">{inputs.horizonMonths}-month model in {c}. Projections are estimates from your assumptions, not audited accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="tag tag-assume">Unsaved changes</span>}
          {demo ? <Link href="/signup" className="btn btn-primary">Save your own model</Link> : (
            <button className="btn btn-primary" disabled={!canEdit || !dirty} onClick={saveVersion}><Save size={14} /> Save new version</button>
          )}
        </div>
      </div>
      {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-good" : "bg-red-50 text-bad"}`}>{msg.text}</p>}

      <nav className="flex gap-1 overflow-x-auto border-b border-line pb-px" aria-label="Model sections">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} aria-current={tab === k} className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-semibold ${tab === k ? "border-b-2 border-forest text-forest" : "text-muted hover:text-ink"}`}>{label}</button>
        ))}
      </nav>

      {result.issues.length > 0 && tab !== "ai" && tab !== "history" && (
        <details className="card border-gold p-3 text-sm" open={hasErrors}>
          <summary className="flex cursor-pointer items-center gap-2 font-semibold"><AlertTriangle size={14} className="text-warn" /> {result.issues.length} input {result.issues.length === 1 ? "check" : "checks"}</summary>
          <ul className="mt-2 list-disc pl-6 text-muted">{result.issues.map((i, k) => <li key={k} className={i.severity === "error" ? "text-bad" : ""}>{i.message} <span className="opacity-60">({i.field})</span></li>)}</ul>
        </details>
      )}

      {tab === "profile" && (
        <Panel title="Business profile & model settings" note="Core settings that every calculation depends on. Currency is explicit; the engine never mixes currencies.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Currency"><select className="input" disabled={!canEdit && !demo} value={inputs.currency} onChange={(e) => patch({ currency: e.target.value as ModelInputs["currency"] })}>{CURRENCIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Planning horizon (months)"><input className="input" type="number" min={1} max={120} value={inputs.horizonMonths} onChange={(e) => patch({ horizonMonths: Math.round(num0(e.target.valueAsNumber)) || 1 })} /></Field>
            <Field label="Opening cash"><input className="input" type="number" min={0} value={inputs.openingCash} onChange={(e) => patch({ openingCash: num0(e.target.valueAsNumber) })} /></Field>
            <Field label="Customer payment terms (days)" hint="0 = customers pay in the month of sale. 30 shifts cash receipts one month later."><input className="input" type="number" min={0} step={15} value={inputs.receivablesDays} onChange={(e) => patch({ receivablesDays: num0(e.target.valueAsNumber) })} /></Field>
            <Field label="Tax rate on operating profit (%)" hint="Simplified: applied to positive monthly operating profit only."><input className="input" type="number" min={0} max={100} value={inputs.taxRatePct} onChange={(e) => patch({ taxRatePct: num0(e.target.valueAsNumber) })} /></Field>
          </div>
        </Panel>
      )}

      {tab === "revenue" && (
        <Panel title="Revenue & pricing assumptions" note="One row per product, service or subscription. Volume is units (or customers) in month 1; growth compounds monthly. For subscriptions, set new customers per month and churn.">
          <EditableTable disabled={!canEdit && !demo} rows={inputs.products} onChange={(products) => patch({ products })} addLabel="Add product / service"
            makeRow={() => ({ name: "New product", kind: "product" as const, price: 0, unitCost: 0, startVolume: 0, monthlyGrowthPct: 0, discountPct: 0 })}
            cols={[
              { key: "name", label: "Name", type: "text", width: "10rem" }, { key: "kind", label: "Type", type: "select", options: ["product", "service", "subscription"] },
              { key: "price", label: "Price", type: "number" }, { key: "unitCost", label: "Direct cost / unit", type: "number" },
              { key: "startVolume", label: "Month-1 volume", type: "number" }, { key: "monthlyGrowthPct", label: "Growth %/mo", type: "number" },
              { key: "discountPct", label: "Discount %", type: "number" },
            ]} />
          <p className="mt-3 text-xs text-muted">Revenue is net of discounts. Subscription products use churn/new-customer inputs when provided; otherwise growth %.</p>
        </Panel>
      )}

      {tab === "costs" && (
        <div className="space-y-5">
          <Panel title="Fixed costs" note="Recurring overheads. Annual growth applies at the start of each model year.">
            <EditableTable disabled={!canEdit && !demo} rows={inputs.fixedCosts} onChange={(fixedCosts) => patch({ fixedCosts })} addLabel="Add fixed cost"
              makeRow={() => ({ name: "New cost", category: "other" as const, monthly: 0, annualGrowthPct: 0 })}
              cols={[{ key: "name", label: "Name", type: "text", width: "10rem" }, { key: "category", label: "Category", type: "select", options: ["rent", "software", "utilities", "insurance", "admin", "marketing", "other"] }, { key: "monthly", label: "Monthly amount", type: "number" }, { key: "annualGrowthPct", label: "Annual growth %", type: "number" }]} />
          </Panel>
          <Panel title="Variable costs (% of revenue)" note="Transaction fees, commissions, delivery and similar costs that scale with sales. Per-unit direct costs are entered on each product.">
            <EditableTable disabled={!canEdit && !demo} rows={inputs.variableCosts} onChange={(variableCosts) => patch({ variableCosts })} addLabel="Add variable cost"
              makeRow={() => ({ name: "New variable cost", pctOfRevenue: 0 })}
              cols={[{ key: "name", label: "Name", type: "text", width: "12rem" }, { key: "pctOfRevenue", label: "% of revenue", type: "number" }]} />
          </Panel>
        </div>
      )}

      {tab === "staffing" && (
        <Panel title="Staffing plan" note="Salary is per person per month. Benefits add an employment-cost percentage. Costs start in the hiring month.">
          <EditableTable disabled={!canEdit && !demo} rows={inputs.staff} onChange={(staff) => patch({ staff })} addLabel="Add role"
            makeRow={() => ({ role: "New role", department: "General", headcount: 1, monthlySalary: 0, benefitsPct: 0, startMonth: 1 })}
            cols={[{ key: "role", label: "Role", type: "text", width: "10rem" }, { key: "department", label: "Department", type: "text" }, { key: "headcount", label: "Headcount", type: "number", step: 1 }, { key: "monthlySalary", label: "Monthly salary", type: "number" }, { key: "benefitsPct", label: "Benefits %", type: "number" }, { key: "startMonth", label: "Start month", type: "number", step: 1 }]} />
        </Panel>
      )}

      {tab === "investments" && (
        <Panel title="Investments & setup costs" note="One-off outflows (equipment, technology, marketing launch, working capital). They affect cash flow and funding needs, not operating profit.">
          <EditableTable disabled={!canEdit && !demo} rows={inputs.investments} onChange={(investments) => patch({ investments })} addLabel="Add investment"
            makeRow={() => ({ name: "New investment", amount: 0, month: 1 })}
            cols={[{ key: "name", label: "Name", type: "text", width: "12rem" }, { key: "amount", label: "Amount", type: "number" }, { key: "month", label: "Month", type: "number", step: 1 }]} />
        </Panel>
      )}

      {tab === "funding" && (
        <div className="space-y-5">
          <Panel title="Funding sources" note="Capital arriving in a given month: founder capital, investment, loans, grants.">
            <EditableTable disabled={!canEdit && !demo} rows={inputs.funding} onChange={(funding) => patch({ funding })} addLabel="Add funding source"
              makeRow={() => ({ name: "New source", type: "founder" as const, amount: 0, month: 1 })}
              cols={[{ key: "name", label: "Name", type: "text", width: "12rem" }, { key: "type", label: "Type", type: "select", options: ["founder", "investment", "loan", "grant", "other"] }, { key: "amount", label: "Amount", type: "number" }, { key: "month", label: "Month", type: "number", step: 1 }]} />
            <p className="mt-3 text-xs text-muted">Loan repayments are not modeled yet; loans are treated as cash inflows only.</p>
          </Panel>
          <FundingSummary r={result} c={c} />
        </div>
      )}

      {tab === "projections" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total revenue" value={money(result.totals.revenue, c, true)} sub="Calculated" />
            <Stat label="Gross profit" value={money(result.totals.grossProfit, c, true)} sub={`${pct(result.grossMarginPct)} margin`} />
            <Stat label="Operating profit" value={money(result.totals.operatingProfit, c, true)} tone={result.totals.operatingProfit >= 0 ? "good" : "bad"} sub={`${pct(result.operatingMarginPct)} margin`} />
            <Stat label="Closing cash" value={money(result.months.at(-1)?.closingCash, c, true)} tone={(result.months.at(-1)?.closingCash ?? 0) >= 0 ? "good" : "bad"} sub="End of horizon" />
          </div>
          <Panel title="Revenue and operating profit"><RevenueProfitChart months={result.months} currency={c} /></Panel>
          <Panel title="Annual and quarterly summary">
            <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Period</th><th className="r">Revenue</th><th className="r">Gross profit</th><th className="r">Operating profit</th><th className="r">Net profit</th><th className="r">Net cash</th><th className="r">Closing cash</th></tr></thead>
              <tbody>{[...result.years, ...result.quarters].map((p) => (<tr key={p.label} className={p.label.startsWith("Year") ? "font-semibold" : ""}><td>{p.label}</td><td className="r num">{money(p.revenue, c)}</td><td className="r num">{money(p.grossProfit, c)}</td><td className="r num">{money(p.operatingProfit, c)}</td><td className="r num">{money(p.netProfit, c)}</td><td className="r num">{money(p.netCash, c)}</td><td className="r num">{money(p.closingCash, c)}</td></tr>))}</tbody></table></div>
          </Panel>
          <Panel title="Monthly projection" actions={<button className="btn btn-ghost" onClick={() => download(`${name}-monthly.csv`, toCsv(result.months as unknown as Record<string, number>[]))}><Download size={14} /> CSV</button>}>
            <div className="max-h-96 overflow-auto"><table className="tbl"><thead><tr><th>Month</th><th className="r">Revenue</th><th className="r">Direct</th><th className="r">Variable</th><th className="r">Fixed</th><th className="r">Staff</th><th className="r">Op. profit</th><th className="r">Closing cash</th></tr></thead>
              <tbody>{result.months.map((m) => (<tr key={m.month}><td>{m.month}</td><td className="r num">{money(m.revenue, c)}</td><td className="r num">{money(m.directCosts, c)}</td><td className="r num">{money(m.variableCosts, c)}</td><td className="r num">{money(m.fixedCosts, c)}</td><td className="r num">{money(m.staffCosts, c)}</td><td className={`r num ${m.operatingProfit < 0 ? "text-bad" : ""}`}>{money(m.operatingProfit, c)}</td><td className={`r num ${m.closingCash < 0 ? "text-bad" : ""}`}>{money(m.closingCash, c)}</td></tr>))}</tbody></table></div>
          </Panel>
        </div>
      )}

      {tab === "profitability" && <Profitability inputs={inputs} result={result} />}

      {tab === "breakeven" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Break-even revenue / month" value={money(result.breakEven.breakEvenRevenue, c)} sub="Calculated" />
            <Stat label="Break-even units / month" value={num(result.breakEven.breakEvenUnits, 0)} sub="Weighted by product mix" />
            <Stat label="Margin of safety" value={pct(result.breakEven.marginOfSafetyPct)} sub={`vs month ${result.breakEven.runRateMonth} revenue`} tone={(result.breakEven.marginOfSafetyPct ?? 0) >= 0 ? "good" : "bad"} />
            <Stat label="First profitable month" value={result.breakEven.firstProfitableMonth ? `Month ${result.breakEven.firstProfitableMonth}` : "Not reached"} sub={`Cash payback: ${result.breakEven.paybackMonth ? `month ${result.breakEven.paybackMonth}` : "not within horizon"}`} />
          </div>
          <Panel title="How this is calculated">
            <p className="text-sm">{result.breakEven.formula}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              <li>Monthly fixed costs + staff at run-rate: <b className="num text-ink">{money(result.breakEven.monthlyFixedCosts, c)}</b></li>
              <li>Weighted contribution per unit: <b className="num text-ink">{money(result.breakEven.weightedUnitContribution, c)}</b></li>
              <li>Contribution margin ratio: <b className="num text-ink">{pct(result.breakEven.contributionMarginPct)}</b></li>
            </ul>
            {result.breakEven.breakEvenRevenue === null && <p className="mt-3 text-sm text-bad">Break-even cannot be computed: contribution per unit is zero or negative, or no sales are modeled. Review price and cost assumptions.</p>}
          </Panel>
        </div>
      )}

      {tab === "cashflow" && (
        <div className="space-y-5">
          <p className="rounded-lg bg-cream p-3 text-sm">Cash flow is not the same as profit: customer payment terms, one-off investments and funding change when cash moves.</p>
          <FundingSummary r={result} c={c} />
          <Panel title="Closing cash balance"><CashChart months={result.months} currency={c} /></Panel>
          <Panel title="Cash flow by month" actions={<button className="btn btn-ghost" onClick={() => download(`${name}-cashflow.csv`, toCsv(result.months.map((m) => ({ month: m.month, receipts: m.cashReceipts, operating_outflows: m.cashOperatingOut, investments: m.investmentOut, financing: m.financingIn, net_cash: m.netCash, closing_cash: m.closingCash }))))}><Download size={14} /> CSV</button>}>
            <div className="max-h-96 overflow-auto"><table className="tbl"><thead><tr><th>Month</th><th className="r">Receipts</th><th className="r">Operating out</th><th className="r">Investment</th><th className="r">Financing</th><th className="r">Net</th><th className="r">Closing</th></tr></thead>
              <tbody>{result.months.map((m) => (<tr key={m.month}><td>{m.month}</td><td className="r num">{money(m.cashReceipts, c)}</td><td className="r num">{money(m.cashOperatingOut, c)}</td><td className="r num">{money(m.investmentOut, c)}</td><td className="r num">{money(m.financingIn, c)}</td><td className="r num">{money(m.netCash, c)}</td><td className={`r num ${m.closingCash < 0 ? "text-bad" : ""}`}>{money(m.closingCash, c)}</td></tr>))}</tbody></table></div>
          </Panel>
        </div>
      )}

      {tab === "scenarios" && <ScenarioPanel inputs={inputs} modelId={modelId} orgId={orgId} canEdit={canEdit} onResultsChange={onScenarioResults} />}

      {tab === "ai" && (
        <div className="space-y-5">
          {dirty && !demo && <p className="rounded-lg bg-amber-50 p-3 text-sm text-warn">You have unsaved changes. AI reads the last saved version — save first to include them.</p>}
          <AiPanel modelId={demo ? null : modelId} orgId={orgId} scenarioResults={scenarioResults} />
        </div>
      )}

      {tab === "plan" && <PlanPanel inputs={inputs} result={result} modelId={demo ? null : modelId} orgId={orgId} canEdit={canEdit} />}

      {tab === "reports" && (
        <Panel title="Reports & exports" note="Exports use the current (possibly unsaved) numbers on screen. Use Print to save any section as PDF.">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={() => download(`${name}-projections.csv`, toCsv(result.months as unknown as Record<string, number>[]))}><Download size={14} /> Financial projections CSV</button>
            <button className="btn btn-ghost" onClick={() => download(`${name}-profitability.csv`, toCsv(result.products as unknown as Record<string, number>[]))}><Download size={14} /> Profitability CSV</button>
            <button className="btn btn-ghost" onClick={() => download(`${name}-summary.txt`, summaryText(name, inputs, result), "text/plain")}><Download size={14} /> Executive summary (text)</button>
            <button className="btn btn-primary" onClick={() => window.print()}>Print / save as PDF</button>
          </div>
          <pre className="mt-5 whitespace-pre-wrap rounded-lg bg-cream p-4 font-sans text-sm leading-relaxed">{summaryText(name, inputs, result)}</pre>
        </Panel>
      )}

      {tab === "history" && (
        <Panel title="Version history" note="Every save creates an immutable version. Restoring loads an earlier version into the editor as an unsaved change; save it to make it current.">
          {demo ? <p className="text-sm text-muted">Version history is available for saved models.</p> : versions.length === 0 ? <p className="text-sm text-muted">No versions yet.</p> : (
            <ul className="divide-y divide-line">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex items-center gap-2"><History size={14} /> <b>Version {v.version_number}</b> <span className="text-muted">{new Date(v.created_at).toLocaleString()}</span></span>
                  <button className="btn btn-ghost" disabled={!canEdit} onClick={() => { setInputs(v.inputs); setTab("profile"); setMsg({ ok: true, text: `Version ${v.version_number} loaded. Save to make it current.` }); }}><RotateCcw size={14} /> Restore</button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
      <p className="pb-6 text-xs text-muted">CreModelAI provides estimates based on the assumptions you enter. Outputs are not audited accounts, guarantees of performance, or financial or investment advice.</p>
    </div>
  );
}

function summaryText(name: string, inputs: ModelInputs, r: ReturnType<typeof computeModel>) {
  const c = inputs.currency;
  return [
    `EXECUTIVE FINANCIAL SUMMARY — ${name}`, `Currency: ${c}. Horizon: ${inputs.horizonMonths} months. Estimates based on user assumptions; not audited.`, "",
    `Revenue: ${money(r.totals.revenue, c)}   Gross profit: ${money(r.totals.grossProfit, c)} (${pct(r.grossMarginPct)})`,
    `Operating profit: ${money(r.totals.operatingProfit, c)} (${pct(r.operatingMarginPct)})   Net profit: ${money(r.totals.netProfit, c)}`,
    `Break-even revenue / month: ${money(r.breakEven.breakEvenRevenue, c)}   First profitable month: ${r.breakEven.firstProfitableMonth ?? "not reached"}`,
    `Lowest cash balance: ${money(r.funding.minClosingCash, c)}   Funding gap: ${money(r.funding.fundingGap, c)}${r.funding.runwayMonths ? ` (cash runs out in month ${r.funding.runwayMonths})` : ""}`,
    "", ...(r.issues.length ? ["Input checks:", ...r.issues.map((i) => `- ${i.message}`)] : []),
  ].join("\n");
}

function FundingSummary({ r, c }: { r: ReturnType<typeof computeModel>; c: string }) {
  const f = r.funding;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Startup & investment" value={money(f.startupCosts, c)} sub="Total one-off outflows" />
      <Stat label="Peak funding need" value={money(f.peakFundingNeed, c)} sub={f.peakMonth ? `Trough in month ${f.peakMonth}, before financing` : "No cash deficit"} />
      <Stat label="Funding gap" value={money(f.fundingGap, c)} tone={f.fundingGap > 0 ? "bad" : "good"} sub={f.runwayMonths ? `Cash runs out in month ${f.runwayMonths}` : "Cash stays positive in horizon"} />
      <Stat label="Receivables outstanding" value={money(f.workingCapitalTied, c)} sub="Working capital tied up at the end" />
    </div>
  );
}

function Profitability({ inputs, result }: { inputs: ModelInputs; result: ReturnType<typeof computeModel> }) {
  const c = inputs.currency;
  const [pid, setPid] = useState(inputs.products[0]?.id ?? "");
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const prod = inputs.products.find((p) => p.id === pid);
  const base = result.products.find((p) => p.id === pid);
  const sim = useMemo(() => {
    if (!prod || newPrice === null || Number.isNaN(newPrice)) return null;
    const m = computeModel({ ...inputs, products: inputs.products.map((p) => (p.id === pid ? { ...p, price: newPrice } : p)) });
    return { r: m, p: m.products.find((p) => p.id === pid)! };
  }, [inputs, pid, newPrice, prod]);
  return (
    <div className="space-y-5">
      <Panel title="Profitability by product / service" note="Contribution = revenue − direct costs − variable costs. Fixed costs are not allocated.">
        <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Product</th><th className="r">Revenue</th><th className="r">Gross margin</th><th className="r">Contribution</th><th className="r">Contribution margin</th><th className="r">Contribution / unit</th><th className="r">Break-even units / mo*</th></tr></thead>
          <tbody>{result.products.map((p) => (<tr key={p.id}><td>{p.name}</td><td className="r num">{money(p.revenue, c)}</td><td className="r num">{pct(p.grossMarginPct)}</td><td className="r num">{money(p.contribution, c)}</td><td className={`r num ${(p.contributionMarginPct ?? 0) < 20 ? "text-warn" : ""}`}>{pct(p.contributionMarginPct)}</td><td className={`r num ${p.unitContribution <= 0 ? "text-bad" : ""}`}>{money(p.unitContribution, c)}</td><td className="r num">{num(p.breakEvenUnitsMonthly)}</td></tr>))}
            {result.products.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted">Add products on the Revenue & pricing tab.</td></tr>}</tbody></table></div>
        <p className="mt-2 text-xs text-muted">*If this product alone had to cover all run-rate fixed and staff costs.</p>
      </Panel>
      {prod && base && (
        <Panel title="Pricing simulator" note="Test a different selling price for one product. Nothing is saved; the comparison is calculated by the engine.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Product"><select className="input" value={pid} onChange={(e) => { setPid(e.target.value); setNewPrice(null); }}>{inputs.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label={`Current price (${c})`}><input className="input" disabled value={prod.price} /></Field>
            <Field label={`Test price (${c})`}><input className="input" type="number" min={0} step="any" value={newPrice ?? ""} placeholder={String(prod.price)} onChange={(e) => setNewPrice(e.target.value === "" ? null : e.target.valueAsNumber)} /></Field>
          </div>
          {sim && (
            <table className="tbl mt-4"><thead><tr><th>Metric</th><th className="r">Current</th><th className="r">At test price</th></tr></thead><tbody>
              <tr><td>Contribution per unit</td><td className="r num">{money(base.unitContribution, c)}</td><td className="r num">{money(sim.p.unitContribution, c)}</td></tr>
              <tr><td>Product revenue (horizon)</td><td className="r num">{money(base.revenue, c)}</td><td className="r num">{money(sim.p.revenue, c)}</td></tr>
              <tr><td>Total operating profit</td><td className="r num">{money(result.totals.operatingProfit, c)}</td><td className="r num">{money(sim.r.totals.operatingProfit, c)}</td></tr>
              <tr><td>Break-even units / month (all products)</td><td className="r num">{num(result.breakEven.breakEvenUnits)}</td><td className="r num">{num(sim.r.breakEven.breakEvenUnits)}</td></tr>
            </tbody></table>
          )}
          <p className="mt-3 text-xs text-muted">This holds sales volume constant. Real demand usually responds to price; test that with the Scenario planner and validate with customers.</p>
        </Panel>
      )}
    </div>
  );
}
