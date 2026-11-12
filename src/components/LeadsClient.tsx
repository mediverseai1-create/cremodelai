"use client";
import { useState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { callAi } from "@/lib/ai-client";
import { createClient } from "@/lib/supabase/client";
import { Empty, Field, Panel } from "./ui";

export interface Lead { id: string; name: string; industry: string | null; region: string | null; notes: string | null; score: number | null; reasoning: string | null }
interface Icp { customersAnalysed: number; topCustomers: { name: string; revenue: number }[]; topProducts: { name: string }[]; topRegions: { name: string }[] }

export default function LeadsClient({ initial, icp, orgId, userId, canEdit }: { initial: Lead[]; icp: Icp; orgId: string; userId: string; canEdit: boolean }) {
  const [leads, setLeads] = useState(initial);
  const [f, setF] = useState({ name: "", industry: "", region: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sb = createClient();

  async function add() {
    if (!f.name.trim()) return;
    const { data, error } = await sb.from("lead_candidates").insert({ org_id: orgId, name: f.name.trim(), industry: f.industry || null, region: f.region || null, notes: f.notes || null, created_by: userId }).select("*").single();
    if (error) return setErr(error.message);
    setLeads([data as Lead, ...leads]); setF({ name: "", industry: "", region: "", notes: "" });
  }
  async function remove(id: string) {
    await sb.from("lead_candidates").delete().eq("id", id);
    setLeads(leads.filter((l) => l.id !== id));
  }
  async function score() {
    setBusy(true); setErr(null);
    try {
      const ids = leads.slice(0, 25).map((l) => l.id);
      await callAi({ agent: "lead_finder", candidateIds: ids });
      const { data } = await sb.from("lead_candidates").select("*").eq("org_id", orgId).order("score", { ascending: false, nullsFirst: false });
      setLeads((data ?? []) as Lead[]);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-5">
      <Panel title="Your ideal customer, learned from who already buys" note="Calculated from your own sales data: the top customers by revenue and what they buy and where. Candidates are scored against this profile.">
        {icp.customersAnalysed === 0 ? <p className="text-sm text-muted">Upload sales data to learn your ideal customer.</p> : (
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div><b>Top customers</b><ul className="mt-1 text-muted">{icp.topCustomers.slice(0, 5).map((c) => <li key={c.name}>{c.name}</li>)}</ul></div>
            <div><b>What they buy</b><ul className="mt-1 text-muted">{icp.topProducts.length ? icp.topProducts.map((c) => <li key={c.name}>{c.name}</li>) : <li>No product column in your data</li>}</ul></div>
            <div><b>Where they are</b><ul className="mt-1 text-muted">{icp.topRegions.length ? icp.topRegions.map((c) => <li key={c.name}>{c.name}</li>) : <li>No region column in your data</li>}</ul></div>
          </div>)}
      </Panel>
      {canEdit && (
        <Panel title="Add candidates" note="Add companies you are considering. Automatic lead discovery from external sources is Coming Soon; scoring uses only what you enter here.">
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Company *"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Industry"><input className="input" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} /></Field>
            <Field label="Region"><input className="input" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} /></Field>
            <Field label="What you know"><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          </div>
          <div className="mt-3 flex gap-2"><button className="btn btn-ghost" onClick={add}>Add candidate</button><button className="btn btn-primary" disabled={busy || leads.length === 0 || icp.customersAnalysed === 0} onClick={score}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Score against my ideal customer</button></div>
          {err && <p role="alert" className="mt-2 text-sm text-bad">{err}</p>}
        </Panel>)}
      {leads.length === 0 ? <Empty title="No candidates yet" body="Add companies above, then score them." /> : (
        <Panel title="Candidates"><table className="tbl"><thead><tr><th>Company</th><th>Industry</th><th>Region</th><th className="r">Fit</th><th>Why</th><th /></tr></thead><tbody>
          {leads.map((l) => (<tr key={l.id}><td><b>{l.name}</b></td><td>{l.industry}</td><td>{l.region}</td><td className="r num">{l.score ?? "—"}</td><td className="max-w-md text-muted">{l.reasoning ?? "Not scored yet"}</td><td><button className="btn btn-ghost !px-2 !py-1" disabled={!canEdit} onClick={() => remove(l.id)} aria-label={`Delete ${l.name}`}><Trash2 size={14} /></button></td></tr>))}
        </tbody></table></Panel>)}
    </div>
  );
}
