"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Briefing } from "@/lib/ai/agents";
import type { RevenueMetrics, Segment } from "@/lib/revenue/analytics";
import { Evidence, Stat } from "./ui";
import { RevenueChart } from "./RevenueChart";

const n = (v: number | null | undefined, cur: string) => (v === null || v === undefined ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v));
const pct = (v: number | null) => (v === null ? "n/a" : `${v > 0 ? "+" : ""}${v}%`);

function SegTable({ title, rows, cur }: { title: string; rows: Segment[]; cur: string }) {
  if (!rows.length) return null;
  return (
    <div className="card overflow-x-auto p-4">
      <h4 className="mb-2 font-display font-bold">{title}</h4>
      <table className="tbl"><thead><tr><th>Name</th><th className="r">Revenue</th><th className="r">Share</th><th className="r">vs previous</th></tr></thead><tbody>
        {rows.slice(0, 6).map((s) => (<tr key={s.name}><td>{s.name}</td><td className="r num">{n(s.revenue, cur)}</td><td className="r num">{s.share}%</td><td className={`r num ${s.changePct !== null && s.changePct < 0 ? "text-bad" : s.changePct ? "text-good" : ""}`}>{pct(s.changePct)}</td></tr>))}
      </tbody></table>
    </div>
  );
}

export function MetricsView({ m, cur }: { m: RevenueMetrics; cur: string }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={n(m.revenue, cur)} sub={<>{m.periodStart} → {m.periodEnd}</>} />
        <Stat label="vs previous period" value={pct(m.changePct)} tone={m.changePct === null ? undefined : m.changePct >= 0 ? "good" : "bad"} sub={`Previous: ${n(m.prevRevenue, cur)}`} />
        <Stat label="Revenue at risk" value={n(m.revenueAtRisk, cur)} tone={m.revenueAtRisk > 0 ? "warn" : "good"} sub={`${m.decliningCustomers.length} declining customer(s)`} />
        <Stat label="Top-customer share" value={m.topCustomerShare === null ? "—" : `${m.topCustomerShare}%`} sub={`${m.customers} active customers`} />
      </div>
      <div className="card p-4"><h4 className="mb-2 font-display font-bold">Monthly revenue <Evidence kind="calculation" /></h4><RevenueChart data={m.monthly} />
        <p className="mt-2 text-xs text-muted">Trend: {m.trend.direction === "insufficient-data" ? "needs at least 4 months of data" : `${m.trend.direction}${m.trend.monthlyChangePct !== null ? ` (${pct(m.trend.monthlyChangePct)}/month)` : ""}, ${m.trend.isSignificant ? "larger than normal month-to-month noise" : "within normal month-to-month noise"}`}.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <SegTable title="Customers" rows={m.segments.customer} cur={cur} />
        <SegTable title="Products" rows={m.segments.product} cur={cur} />
        <SegTable title="Regions" rows={m.segments.region} cur={cur} />
        <SegTable title="Reps" rows={m.segments.rep} cur={cur} />
      </div>
      {m.decliningCustomers.length > 0 && <SegTable title="Declining customers (down 20%+)" rows={m.decliningCustomers} cur={cur} />}
      {m.warnings.length > 0 && <ul className="list-disc pl-5 text-sm text-warn">{m.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
    </div>
  );
}

export function BriefingView({ metrics, content, orgId, userId, cur, canEdit }: { metrics: RevenueMetrics; content: Briefing | null; orgId: string | null; userId: string | null; cur: string; canEdit: boolean }) {
  const [added, setAdded] = useState<Record<number, boolean>>({});
  async function add(i: number) {
    if (!content || !orgId) return;
    const a = content.nextActions[i];
    const { error } = await createClient().from("recommended_actions").insert({ org_id: orgId, title: a.title, description: `${a.reason}${a.account ? ` (Account: ${a.account})` : ""}`, priority: a.priority, source: "ai", created_by: userId });
    if (!error) setAdded((s) => ({ ...s, [i]: true }));
  }
  return (
    <div className="space-y-5">
      {content ? (
        <>
          <div className="rounded-xl bg-cream p-5"><Evidence kind="interpretation" /><h3 className="mt-2 font-display text-2xl font-extrabold">{content.headline}</h3><p className="mt-2 leading-relaxed">{content.summary}</p></div>
          {content.performance.length > 0 && <section><h4 className="mb-2 font-display text-lg font-bold">What happened</h4><ul className="grid gap-3 md:grid-cols-2">{content.performance.map((p, i) => <li key={i} className="card p-3 text-sm"><b>{p.area}</b><p className="text-muted">{p.detail}</p></li>)}</ul></section>}
          {content.atRisk.length > 0 && <section><h4 className="mb-2 font-display text-lg font-bold">What&apos;s at risk</h4><ul className="space-y-2">{content.atRisk.map((p, i) => <li key={i} className="card border-l-4 border-bad p-3 text-sm"><b>{p.title}</b><p className="text-muted">{p.detail}</p></li>)}</ul></section>}
          {content.strategy.length > 0 && <section><h4 className="mb-2 font-display text-lg font-bold">Strategy from your own wins</h4><ul className="space-y-2">{content.strategy.map((p, i) => <li key={i} className="card p-3 text-sm"><b>{p.title}</b><p className="text-muted">{p.rationale}</p></li>)}</ul></section>}
          {content.nextActions.length > 0 && <section><h4 className="mb-2 font-display text-lg font-bold">Next best actions</h4><ul className="space-y-2">{content.nextActions.map((a, i) => (
            <li key={i} className="card flex items-start justify-between gap-3 p-3 text-sm"><div><b>{a.title}</b> <span className="tag tag-assume">{a.priority}</span>{a.account && <span className="tag tag-calc ml-1">{a.account}</span>}<p className="text-muted">{a.reason}</p></div>
              {orgId && canEdit && <button className="btn btn-ghost shrink-0" disabled={added[i]} onClick={() => add(i)}>{added[i] ? "Added" : "Add to queue"}</button>}</li>))}</ul></section>}
          {content.unusual.length > 0 && <section><h4 className="mb-1 font-display text-lg font-bold">Worth a second look</h4><ul className="list-disc pl-5 text-sm text-muted">{content.unusual.map((u, i) => <li key={i}>{u}</li>)}</ul></section>}
          <p className="text-xs text-muted">{content.limitations}</p>
        </>
      ) : <p className="rounded-lg bg-amber-50 p-3 text-sm text-warn">No written narrative for this briefing (AI was unavailable). The calculated figures below are complete.</p>}
      <MetricsView m={metrics} cur={cur} />
    </div>
  );
}
