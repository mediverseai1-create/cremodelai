"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { callAi } from "@/lib/ai-client";
import { createClient } from "@/lib/supabase/client";
import type { ConversationAnalysis } from "@/lib/ai/agents";
import { Empty, Evidence, Field, Panel } from "./ui";

export interface Conv { id: string; title: string; transcript: string; analysis: ConversationAnalysis | null; created_at: string; deal_id: string | null }

function Analysis({ a }: { a: ConversationAnalysis }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg bg-cream p-3"><Evidence kind="interpretation" /> <span className={`tag ml-1 ${a.buyerIntent === "high" ? "tag-calc" : a.buyerIntent === "low" ? "tag-unver" : "tag-assume"}`}>Intent: {a.buyerIntent}</span><p className="mt-2">{a.summary}</p><p className="mt-1 text-muted">{a.intentReason}</p></div>
      {a.objections.length > 0 && <div><h4 className="font-display font-bold">Objections</h4><ul className="mt-1 space-y-2">{a.objections.map((o, i) => <li key={i} className="card p-3"><b>{o.objection}</b><p className="text-muted">Suggested response: {o.suggestedResponse}</p></li>)}</ul></div>}
      {a.commitments.length > 0 && <div><h4 className="font-display font-bold">Commitments</h4><ul className="list-disc pl-5 text-muted">{a.commitments.map((c, i) => <li key={i}>{c.what}{c.when ? ` (${c.when})` : ""}</li>)}</ul></div>}
      {a.nextSteps.length > 0 && <div><h4 className="font-display font-bold">Next steps</h4><ul className="list-disc pl-5 text-muted">{a.nextSteps.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
      {a.risks.length > 0 && <div><h4 className="font-display font-bold">Risks</h4><ul className="list-disc pl-5 text-bad">{a.risks.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
    </div>
  );
}

export default function ConversationsClient({ initial, deals, orgId, userId, canEdit }: { initial: Conv[]; deals: { id: string; name: string }[]; orgId: string; userId: string; canEdit: boolean }) {
  const [list, setList] = useState(initial);
  const [f, setF] = useState({ title: "", deal: "", transcript: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function analyse(id: string) {
    setBusy(id); setErr(null);
    try {
      const r = await callAi<ConversationAnalysis>({ agent: "conversation", conversationId: id });
      if (r.result) setList((l) => l.map((c) => (c.id === id ? { ...c, analysis: r.result! } : c)));
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(null); }
  }
  async function save() {
    setErr(null);
    if (!f.title.trim() || f.transcript.trim().length < 50) return setErr("Add a title and a transcript (at least a few sentences).");
    const { data, error } = await createClient().from("conversations").insert({ org_id: orgId, title: f.title.trim(), transcript: f.transcript, deal_id: f.deal || null, created_by: userId }).select("*").single();
    if (error) return setErr(error.message);
    setList([data as Conv, ...list]); setF({ title: "", deal: "", transcript: "" });
    analyse(data.id);
  }
  return (
    <div className="space-y-5">
      {canEdit && (
        <Panel title="Add a call" note="Paste a transcript (text or exported captions). Audio upload and automatic transcription are Coming Soon.">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Discovery call — Acme" /></Field>
            <Field label="Linked deal (optional)"><select className="input" value={f.deal} onChange={(e) => setF({ ...f, deal: e.target.value })}><option value="">None</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          </div>
          <Field label="Transcript"><textarea className="input mt-3" rows={7} value={f.transcript} onChange={(e) => setF({ ...f, transcript: e.target.value })} /></Field>
          {err && <p role="alert" className="mt-2 text-sm text-bad">{err}</p>}
          <button className="btn btn-primary mt-3" onClick={save}>Save and analyse</button>
        </Panel>
      )}
      {list.length === 0 ? <Empty title="No conversations yet" body="Objections, buyer intent, commitments and next steps come out of every call you add." /> : list.map((c) => (
        <Panel key={c.id} title={c.title} note={new Date(c.created_at).toLocaleString()} actions={!c.analysis && canEdit ? <button className="btn btn-ghost" disabled={busy === c.id} onClick={() => analyse(c.id)}>{busy === c.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Analyse</button> : undefined}>
          {c.analysis ? <Analysis a={c.analysis} /> : <p className="text-sm text-muted">{busy === c.id ? "Analysing… this can take up to a minute." : "Not analysed yet."}</p>}
          <details className="mt-3 text-sm"><summary className="cursor-pointer text-muted">Transcript</summary><p className="mt-2 whitespace-pre-wrap text-muted">{c.transcript}</p></details>
        </Panel>))}
    </div>
  );
}
