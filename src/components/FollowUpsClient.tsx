"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { callAi } from "@/lib/ai-client";
import { followUpStatus } from "@/lib/revenue/analytics";
import { today } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { STAGE_LABEL, type Deal } from "./PipelineClient";
import { Empty, Panel } from "./ui";

interface Draft { whyNow: string; suggestedTiming: string; subject: string; message: string }
const ORDER = { overdue: 0, "due-today": 1, stale: 2, scheduled: 3, none: 4 } as const;
const LABEL = { overdue: "Overdue", "due-today": "Due today", stale: "Gone quiet (14+ days)", scheduled: "Scheduled", none: "" } as const;

export default function FollowUpsClient({ deals: initial, canEdit }: { deals: Deal[]; canEdit: boolean }) {
  const [deals, setDeals] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const t = today();
  const list = deals.map((d) => ({ d, s: followUpStatus(d, t) })).filter((x) => x.s !== "none").sort((a, b) => ORDER[a.s] - ORDER[b.s]);

  async function draft(id: string) {
    setBusy(id); setErr(null);
    try { const r = await callAi<Draft>({ agent: "follow_up", dealId: id }); if (r.result) setDrafts((x) => ({ ...x, [id]: r.result! })); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(null); }
  }
  async function done(id: string, next: string | null) {
    const { error } = await createClient().from("pipeline_deals").update({ last_contact: t, follow_up_on: next, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) setDeals(deals.map((d) => (d.id === id ? { ...d, last_contact: t, follow_up_on: next } : d)));
  }
  if (list.length === 0) return <Empty title="Nothing needs a follow-up" body="Deals with a follow-up date, or that have gone quiet for 14+ days, show up here with the reason and a drafted message." />;
  return (
    <div className="space-y-4">
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-bad">{err}</p>}
      {list.map(({ d, s }) => (
        <Panel key={d.id} title={d.name} note={<>{d.account && `${d.account} · `}{STAGE_LABEL[d.stage]}{d.owner && ` · ${d.owner}`}</>} actions={<span className={`tag ${s === "overdue" ? "tag-unver" : s === "due-today" ? "tag-assume" : "tag-calc"}`}>{LABEL[s]}{d.follow_up_on && s !== "stale" ? ` · ${d.follow_up_on}` : ""}</span>}>
          {d.notes && <p className="mb-3 text-sm text-muted">Notes: {d.notes}</p>}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" disabled={!canEdit || busy === d.id} onClick={() => draft(d.id)}>{busy === d.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft follow-up</button>
            <button className="btn btn-ghost" disabled={!canEdit} onClick={() => done(d.id, null)}>Mark contacted</button>
          </div>
          {drafts[d.id] && <div className="mt-4 space-y-2 rounded-lg bg-cream p-4 text-sm"><p><b>Why now:</b> {drafts[d.id].whyNow}</p><p><b>When:</b> {drafts[d.id].suggestedTiming}</p><p><b>Subject:</b> {drafts[d.id].subject}</p><p className="whitespace-pre-wrap rounded bg-white p-3">{drafts[d.id].message}</p></div>}
        </Panel>))}
    </div>
  );
}
