"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/engine/types";
import { Field, Panel } from "./ui";

export default function SettingsClient({ org, isAdmin }: { org: { id: string; name: string; currency: string; industry: string | null; planning_horizon_months: number }; isAdmin: boolean }) {
  const [f, setF] = useState({ name: org.name, currency: org.currency, industry: org.industry ?? "", horizon: org.planning_horizon_months });
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function save() {
    const { error } = await createClient().from("organizations").update({ name: f.name, currency: f.currency, industry: f.industry, planning_horizon_months: f.horizon }).eq("id", org.id);
    setMsg({ ok: !error, t: error ? error.message : "Settings saved." });
  }
  async function changePw() {
    if (pw.length < 8) { setMsg({ ok: false, t: "Password must be at least 8 characters." }); return; }
    const { error } = await createClient().auth.updateUser({ password: pw });
    setMsg({ ok: !error, t: error ? error.message : "Password updated." }); if (!error) setPw("");
  }
  return (
    <div className="space-y-5">
      <Panel title="Organization" note="Defaults for new models. Existing models keep their own currency and horizon.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><input className="input" disabled={!isAdmin} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Industry"><input className="input" disabled={!isAdmin} value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} /></Field>
          <Field label="Default currency"><select className="input" disabled={!isAdmin} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Default horizon (months)"><input className="input" type="number" min={1} max={120} disabled={!isAdmin} value={f.horizon} onChange={(e) => setF({ ...f, horizon: e.target.valueAsNumber || 12 })} /></Field>
        </div>
        <button className="btn btn-primary mt-4" disabled={!isAdmin} onClick={save}>Save</button>
        {!isAdmin && <p className="mt-2 text-xs text-muted">Only owners and administrators can change organization settings.</p>}
      </Panel>
      <Panel title="Account password"><div className="flex gap-2"><input className="input max-w-xs" type="password" placeholder="New password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /><button className="btn btn-ghost" onClick={changePw}>Update</button></div></Panel>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-good" : "text-bad"}`}>{msg.t}</p>}
    </div>
  );
}
