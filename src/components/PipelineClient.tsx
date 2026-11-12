"use client";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { today } from "@/lib/format";
import { Empty, Field, Panel } from "./ui";

export interface Deal { id: string; name: string; account: string | null; owner: string | null; stage: string; value: number | null; expected_close: string | null; follow_up_on: string | null; last_contact: string | null; notes: string | null }
export const STAGES = ["find", "prepare", "converse", "follow_up", "close", "won", "lost"] as const;
export const STAGE_LABEL: Record<string, string> = { find: "Find", prepare: "Prepare", converse: "Converse", follow_up: "Follow up", close: "Close", won: "Won", lost: "Lost" };

export default function PipelineClient({ initial, orgId, userId, cur, canEdit }: { initial: Deal[]; orgId: string; userId: string; cur: string; canEdit: boolean }) {
  const [deals, setDeals] = useState(initial);
  const blank = { name: "", account: "", owner: "", stage: "find", value: "", expected_close: "", follow_up_on: "", notes: "" };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const sb = createClient();

  async function add() {
    setErr(null);
    const value = f.value === "" ? null : Number(f.value);
    if (!f.name.trim()) return setErr("Give the deal a name.");
    if (value !== null && (Number.isNaN(value) || value < 0)) return setErr("Value must be a positive number.");
    const { data, error } = await sb.from("pipeline_deals").insert({ org_id: orgId, name: f.name.trim(), account: f.account || null, owner: f.owner || null, stage: f.stage, value, expected_close: f.expected_close || null, follow_up_on: f.follow_up_on || null, last_contact: today(), notes: f.notes || null, created_by: userId }).select("*").single();
    if (error) return setErr(error.message);
    setDeals([data as Deal, ...deals]); setF(blank);
  }
  async function patch(id: string, p: Partial<Deal>) {
    const { error } = await sb.from("pipeline_deals").update({ ...p, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) setDeals(deals.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }
  async function remove(d: Deal) {
    if (!window.confirm(`Delete "${d.name}"?`)) return;
    const { error } = await sb.from("pipeline_deals").delete().eq("id", d.id);
    if (!error) setDeals(deals.filter((x) => x.id !== d.id));
  }
  const shown = useMemo(() => deals.filter((d) => (d.name + (d.account ?? "")).toLowerCase().includes(q.toLowerCase())), [deals, q]);
  const open = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const openValue = open.reduce((a, d) => a + (d.value ?? 0), 0);
  const fmt = (v: number | null) => (v === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v));

  return (
    <div className="space-y-5">
      {canEdit && (
        <Panel title="Add a deal">
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Deal name *"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Account"><input className="input" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} /></Field>
            <Field label="Owner"><input className="input" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></Field>
            <Field label={`Value (${cur})`}><input className="input" type="number" min={0} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
            <Field label="Stage"><select className="input" value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></Field>
            <Field label="Expected close"><input className="input" type="date" value={f.expected_close} onChange={(e) => setF({ ...f, expected_close: e.target.value })} /></Field>
            <Field label="Follow up on"><input className="input" type="date" value={f.follow_up_on} onChange={(e) => setF({ ...f, follow_up_on: e.target.value })} /></Field>
            <Field label="Notes (e.g. “call back in September”)"><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          </div>
          {err && <p role="alert" className="mt-2 text-sm text-bad">{err}</p>}
          <button className="btn btn-primary mt-3" onClick={add}>Add deal</button>
        </Panel>
      )}
      {deals.length === 0 ? <Empty title="No deals yet" body="Add the deals you are working. Follow-ups and the stage flow run from here." /> : (
        <Panel title={`Pipeline · ${open.length} open · ${fmt(openValue)}`} actions={<input className="input w-52" placeholder="Search…" aria-label="Search deals" value={q} onChange={(e) => setQ(e.target.value)} />}>
          <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Deal</th><th>Owner</th><th className="r">Value</th><th>Stage</th><th>Follow up</th><th>Notes</th><th /></tr></thead><tbody>
            {shown.map((d) => (
              <tr key={d.id}>
                <td><b>{d.name}</b>{d.account && <span className="block text-xs text-muted">{d.account}</span>}</td><td>{d.owner}</td><td className="r num">{fmt(d.value)}</td>
                <td><select className="input w-auto" disabled={!canEdit} value={d.stage} onChange={(e) => patch(d.id, { stage: e.target.value, last_contact: today() })} aria-label="Stage">{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></td>
                <td><input className="input w-36" type="date" disabled={!canEdit} value={d.follow_up_on ?? ""} onChange={(e) => patch(d.id, { follow_up_on: e.target.value || null })} aria-label="Follow up date" /></td>
                <td className="max-w-[16rem] text-muted">{d.notes}</td>
                <td><button className="btn btn-ghost !px-2 !py-1" disabled={!canEdit} onClick={() => remove(d)} aria-label={`Delete ${d.name}`}><Trash2 size={14} /></button></td>
              </tr>))}
          </tbody></table></div>
        </Panel>
      )}
    </div>
  );
}
