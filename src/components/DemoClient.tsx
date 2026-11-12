"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CADENCES, computeMetrics } from "@/lib/revenue/analytics";
import { sampleSales } from "@/lib/revenue/sample";
import { MetricsView } from "./BriefingView";
import { Logo } from "./Logo";

export default function DemoClient() {
  const rows = useMemo(() => sampleSales(), []);
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>("monthly");
  const m = useMemo(() => computeMetrics(rows, cadence), [rows, cadence]);
  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between"><Link href="/"><Logo /></Link><Link href="/signup" className="btn btn-primary">Create your account</Link></div>
      <p className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-warn">This is <b>sample data</b> for a made-up business ({rows.length} rows). Change the reporting rhythm to see the calculated findings update. Written briefings, follow-ups and Ask need an account.</p>
      <div className="mb-5 flex flex-wrap items-center gap-2"><label className="label !mb-0" htmlFor="c">Reporting rhythm</label>
        <select id="c" className="input w-auto" value={cadence} onChange={(e) => setCadence(e.target.value as typeof cadence)}>{CADENCES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select></div>
      <MetricsView m={m} cur="USD" />
      {(m.opportunities.length > 0 || m.underperformers.length > 0) && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="card p-4"><h4 className="font-display font-bold">Room to grow</h4><ul className="mt-2 space-y-1 text-sm">{m.opportunities.slice(0, 5).map((o) => <li key={o.dimension + o.name}><b>{o.name}</b> <span className="text-muted">({o.dimension}) · {o.why}</span></li>)}{m.opportunities.length === 0 && <li className="text-muted">Nothing stands out this period.</li>}</ul></section>
          <section className="card p-4"><h4 className="font-display font-bold">Falling behind</h4><ul className="mt-2 space-y-1 text-sm">{m.underperformers.slice(0, 5).map((o) => <li key={o.dimension + o.name}><b>{o.name}</b> <span className="text-muted">({o.dimension}) · {o.why}</span></li>)}{m.underperformers.length === 0 && <li className="text-muted">Nothing stands out this period.</li>}</ul></section>
        </div>)}
    </div>
  );
}
