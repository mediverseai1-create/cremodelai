"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Copy, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createModel, emptyInputs } from "@/lib/models";
import { modelInputsSchema } from "@/lib/engine/types";
import { money } from "@/lib/format";
import { Empty, Panel } from "./ui";
import type { ModelSummary } from "@/lib/load-models";

export default function ModelsList({ models, orgId, userId, currency, horizon, canEdit }: { models: ModelSummary[]; orgId: string; userId: string; currency: string; horizon: number; canEdit: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"updated" | "name" | "revenue">("updated");
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PER = 10;

  const rows = useMemo(() => {
    const f = models.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
    return [...f].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "revenue" ? b.revenue - a.revenue : b.updated_at.localeCompare(a.updated_at));
  }, [models, q, sort]);
  const view = rows.slice(page * PER, page * PER + PER);

  async function create() {
    if (!name.trim()) return;
    try {
      const { data: auth } = await createClient().auth.getUser();
      const id = await createModel(createClient(), orgId, userId || auth.user!.id, name.trim(), emptyInputs(currency, horizon));
      router.push(`/app/models/${id}`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  }
  async function duplicate(m: ModelSummary) {
    const sb = createClient();
    const { data: src } = await sb.from("business_models").select("current_version_id").eq("id", m.id).single();
    const { data: v } = await sb.from("financial_model_versions").select("inputs").eq("id", src!.current_version_id).single();
    const p = modelInputsSchema.safeParse(v?.inputs);
    if (!p.success) { setErr("Cannot duplicate: saved inputs are invalid."); return; }
    const id = await createModel(sb, orgId, userId, `${m.name} (copy)`, p.data);
    router.push(`/app/models/${id}`);
  }
  async function archive(m: ModelSummary) {
    if (!window.confirm(`Archive "${m.name}"? You can still find it in the database but it will leave your active list.`)) return;
    await createClient().from("business_models").update({ status: "archived" }).eq("id", m.id);
    await createClient().from("model_change_history").insert({ org_id: orgId, model_id: m.id, user_id: userId, summary: "Model archived" });
    router.refresh();
  }
  const cmp = models.filter((m) => picked.includes(m.id));

  return (
    <div className="space-y-5">
      {canEdit && (
        <Panel title="Create a business model">
          <div className="flex flex-wrap gap-2">
            <input className="input max-w-sm" placeholder="Model name, e.g. Bakery — Year 1" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
            <button className="btn btn-primary" onClick={create} disabled={!name.trim()}><Plus size={14} /> Create</button>
          </div>
          {err && <p role="alert" className="mt-2 text-sm text-bad">{err}</p>}
        </Panel>
      )}
      {models.length === 0 ? <Empty title="No business models yet" body="Create your first model, then enter your own assumptions. All dashboard figures come from the models you save." /> : (
        <Panel title="Your models" actions={
          <div className="flex gap-2">
            <input className="input w-48" placeholder="Search…" aria-label="Search models" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
            <select className="input w-36" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="updated">Recently updated</option><option value="name">Name</option><option value="revenue">Revenue</option></select>
          </div>}>
          <div className="overflow-x-auto"><table className="tbl">
            <thead><tr><th>Compare</th><th>Model</th><th className="r">Revenue</th><th className="r">Operating profit</th><th className="r">Funding gap</th><th>Updated</th><th /></tr></thead>
            <tbody>{view.map((m) => (
              <tr key={m.id}>
                <td><input type="checkbox" aria-label={`Compare ${m.name}`} checked={picked.includes(m.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, m.id].slice(-3) : picked.filter((x) => x !== m.id))} /></td>
                <td><Link className="font-semibold text-forest underline" href={`/app/models/${m.id}`}>{m.name}</Link>{!m.valid && <span className="tag tag-unver ml-2">needs input review</span>}</td>
                <td className="r num">{money(m.revenue, m.currency, true)}</td>
                <td className={`r num ${m.operatingProfit < 0 ? "text-bad" : ""}`}>{money(m.operatingProfit, m.currency, true)}</td>
                <td className={`r num ${m.fundingGap > 0 ? "text-bad" : ""}`}>{money(m.fundingGap, m.currency, true)}</td>
                <td className="text-muted">{new Date(m.updated_at).toLocaleDateString()}</td>
                <td className="whitespace-nowrap text-right">
                  <button className="btn btn-ghost !px-2 !py-1" disabled={!canEdit} onClick={() => duplicate(m)} aria-label={`Duplicate ${m.name}`}><Copy size={14} /></button>{" "}
                  <button className="btn btn-ghost !px-2 !py-1" disabled={!canEdit} onClick={() => archive(m)} aria-label={`Archive ${m.name}`}><Archive size={14} /></button>
                </td>
              </tr>))}</tbody></table></div>
          {rows.length > PER && <div className="mt-3 flex items-center gap-2 text-sm"><button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {Math.ceil(rows.length / PER)}</span><button className="btn btn-ghost" disabled={(page + 1) * PER >= rows.length} onClick={() => setPage(page + 1)}>Next</button></div>}
        </Panel>
      )}
      {cmp.length >= 2 && (
        <Panel title="Model comparison" note="Calculated from each model's current saved version. Models in different currencies are shown in their own currency and are not combined.">
          <table className="tbl"><thead><tr><th>Metric</th>{cmp.map((m) => <th key={m.id} className="r">{m.name}</th>)}</tr></thead><tbody>
            {([["Revenue", (m: ModelSummary) => money(m.revenue, m.currency)], ["Operating profit", (m: ModelSummary) => money(m.operatingProfit, m.currency)], ["Break-even revenue / mo", (m: ModelSummary) => money(m.breakEvenRevenue, m.currency)], ["Funding gap", (m: ModelSummary) => money(m.fundingGap, m.currency)], ["Lowest cash", (m: ModelSummary) => money(m.minCash, m.currency)], ["First profitable month", (m: ModelSummary) => m.firstProfitableMonth ? `Month ${m.firstProfitableMonth}` : "Not reached"]] as [string, (m: ModelSummary) => string][]).map(([label, fn]) => (
              <tr key={label}><td>{label}</td>{cmp.map((m) => <td key={m.id} className="r num">{fn(m)}</td>)}</tr>))}
          </tbody></table>
        </Panel>
      )}
    </div>
  );
}
