"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Empty, Panel } from "./ui";

interface Action { id: string; title: string; description: string | null; priority: string; status: string; notes: string | null; source: string; created_at: string; completed_at: string | null; model_name?: string }

export default function ActionsClient({ initial, models, orgId, userId, canEdit }: { initial: Action[]; models: { id: string; name: string }[]; orgId: string; userId: string; canEdit: boolean }) {
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState("active");
  const [f, setF] = useState({ title: "", priority: "medium", model: models[0]?.id ?? "" });
  const sb = createClient();

  async function add() {
    if (!f.title.trim()) return;
    const { data } = await sb.from("recommended_actions").insert({ org_id: orgId, model_id: f.model || null, title: f.title.trim(), priority: f.priority, created_by: userId, assignee: userId }).select("*").single();
    if (data) { setList([data as Action, ...list]); setF({ ...f, title: "" }); }
  }
  async function patch(id: string, p: Partial<Action>) {
    const extra = p.status === "done" ? { completed_at: new Date().toISOString() } : {};
    const { error } = await sb.from("recommended_actions").update({ ...p, ...extra }).eq("id", id);
    if (!error) setList(list.map((a) => (a.id === id ? { ...a, ...p, ...extra } : a)));
  }
  const shown = list.filter((a) => (filter === "active" ? ["open", "in_progress"].includes(a.status) : filter === "all" ? true : a.status === filter));
  return (
    <div className="space-y-5">
      {canEdit && <Panel title="Add an action"><div className="flex flex-wrap gap-2">
        <input className="input max-w-md" placeholder="e.g. Validate expected monthly sales volume" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label="Action title" />
        <select className="input w-auto" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} aria-label="Priority"><option>high</option><option>medium</option><option>low</option></select>
        <select className="input w-auto" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} aria-label="Model"><option value="">No model</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <button className="btn btn-primary" onClick={add}>Add</button></div></Panel>}
      <Panel title="Actions" actions={<select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter"><option value="active">Active</option><option value="done">Done</option><option value="dismissed">Dismissed</option><option value="all">All</option></select>}>
        {shown.length === 0 ? <Empty title="Nothing here" body="Add actions yourself or from AI recommendations. AI never changes your model without you." /> : (
          <ul className="divide-y divide-line">{shown.map((a) => (
            <li key={a.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><b>{a.title}</b> <span className="tag tag-assume">{a.priority}</span> {a.source === "ai" && <span className="tag tag-ai">AI suggested</span>}
                  {a.description && <p className="text-muted">{a.description}</p>}</div>
                <select className="input w-auto" disabled={!canEdit} value={a.status} onChange={(e) => patch(a.id, { status: e.target.value })} aria-label="Status"><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="dismissed">Dismissed</option></select>
              </div>
              <input className="input mt-2" disabled={!canEdit} placeholder="Notes (saved when you leave the field)" defaultValue={a.notes ?? ""} onBlur={(e) => e.target.value !== (a.notes ?? "") && patch(a.id, { notes: e.target.value })} aria-label="Notes" />
              {a.completed_at && <p className="mt-1 text-xs text-muted">Completed {new Date(a.completed_at).toLocaleString()}</p>}
            </li>))}</ul>)}
      </Panel>
    </div>
  );
}
