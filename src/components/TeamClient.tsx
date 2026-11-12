"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "./ui";

export default function TeamClient({ members, orgId, roles, isAdmin, meId }: { members: { user_id: string; role: string; name: string | null }[]; orgId: string; roles: Record<string, string>; isAdmin: boolean; meId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function add() {
    const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, email, role }) });
    const j = await res.json();
    setMsg({ ok: res.ok, t: res.ok ? "Member added." : j.error });
    if (res.ok) { setEmail(""); router.refresh(); }
  }
  async function change(uid: string, r: string) {
    const { error } = await createClient().from("organization_members").update({ role: r }).eq("org_id", orgId).eq("user_id", uid);
    setMsg({ ok: !error, t: error ? error.message : "Role updated." }); router.refresh();
  }
  async function remove(uid: string) {
    if (!window.confirm("Remove this member from the organization?")) return;
    const { error } = await createClient().from("organization_members").delete().eq("org_id", orgId).eq("user_id", uid);
    setMsg({ ok: !error, t: error ? error.message : "Member removed." }); router.refresh();
  }
  return (
    <div className="space-y-5">
      <Panel title="Members">
        <table className="tbl"><thead><tr><th>Member</th><th>Role</th><th /></tr></thead><tbody>
          {members.map((m) => (<tr key={m.user_id}><td>{m.name || m.user_id.slice(0, 8)}{m.user_id === meId && " (you)"}</td>
            <td><select className="input w-auto" disabled={!isAdmin || m.user_id === meId} value={m.role} onChange={(e) => change(m.user_id, e.target.value)} aria-label="Role">{Object.entries(roles).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
            <td className="text-right">{isAdmin && m.user_id !== meId && <button className="btn btn-danger !py-1" onClick={() => remove(m.user_id)}>Remove</button>}</td></tr>))}
        </tbody></table>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-good" : "text-bad"}`}>{msg.t}</p>}
      </Panel>
      {isAdmin ? (
        <Panel title="Add a member" note="They need a CreModelAI account first. View-only members can read everything but cannot change data.">
          <div className="flex flex-wrap gap-2">
            <input className="input max-w-xs" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">{Object.entries(roles).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button className="btn btn-primary" disabled={!email} onClick={add}>Add member</button>
          </div>
        </Panel>) : <p className="text-sm text-muted">Only owners and administrators can manage members.</p>}
    </div>
  );
}
