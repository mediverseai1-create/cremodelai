"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { callAi } from "@/lib/ai-client";
import { CADENCES, CADENCE_DAYS, type RevenueMetrics } from "@/lib/revenue/analytics";
import type { Briefing } from "@/lib/ai/agents";
import { BriefingView } from "./BriefingView";
import { Empty, Panel } from "./ui";

export interface BriefingRow { id: string; cadence: string; period_start: string; period_end: string; created_at: string; metrics: RevenueMetrics; content: Briefing | null }

export default function BriefingsClient({ rows, orgId, userId, cur, canEdit, hasData }: { rows: BriefingRow[]; orgId: string; userId: string; cur: string; canEdit: boolean; hasData: boolean }) {
  const router = useRouter();
  const [cadence, setCadence] = useState<(typeof CADENCES)[number]>("weekly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sel, setSel] = useState(rows[0]?.id ?? "");
  const current = rows.find((r) => r.id === sel) ?? rows[0];

  async function generate() {
    setBusy(true); setErr(null); setInfo(null);
    try {
      const r = await callAi({ agent: "briefing", cadence });
      if (r.message) setInfo(r.message);
      if (r.briefingId) setSel(r.briefingId);
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-5">
      <Panel title="Generate a briefing" note="Pick the rhythm you run on. The numbers are calculated from your sales data (this period against the one before it); the AI writes the plain-English read and the plan.">
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={cadence} onChange={(e) => setCadence(e.target.value as typeof cadence)} aria-label="Cadence">{CADENCES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)} ({CADENCE_DAYS[c]} day{CADENCE_DAYS[c] > 1 ? "s" : ""})</option>)}</select>
          <button className="btn btn-primary" disabled={busy || !canEdit || !hasData} onClick={generate}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate briefing</button>
        </div>
        {!hasData && <p className="mt-3 text-sm text-warn">Upload sales data first.</p>}
        {busy && <p className="mt-3 text-sm text-muted">Writing your briefing. This can take up to a minute.</p>}
        {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-bad">{err}</p>}
        {info && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-warn">{info}</p>}
      </Panel>
      {rows.length === 0 ? <Empty title="No briefings yet" body="Your briefings are saved here run after run, so the whole team can see them." /> : (
        <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
          <ul className="card h-fit divide-y divide-line text-sm">
            {rows.map((r) => (<li key={r.id}><button className={`w-full px-3 py-3 text-left ${r.id === current?.id ? "bg-cream font-semibold" : ""}`} onClick={() => setSel(r.id)}>{r.cadence[0].toUpperCase() + r.cadence.slice(1)}<span className="block text-xs font-normal text-muted">{r.period_start} → {r.period_end}</span><span className="block text-xs font-normal text-muted">{new Date(r.created_at).toLocaleString()}</span></button></li>))}
          </ul>
          {current && <div className="min-w-0"><BriefingView key={current.id} metrics={current.metrics} content={current.content} orgId={orgId} userId={userId} cur={cur} canEdit={canEdit} /></div>}
        </div>
      )}
    </div>
  );
}
