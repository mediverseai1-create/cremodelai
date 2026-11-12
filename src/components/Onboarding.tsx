"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/currencies";
import { Field } from "./ui";

const INDUSTRIES = ["Software / SaaS", "Professional services", "Wholesale & distribution", "Retail & e-commerce", "Manufacturing", "Real estate", "Healthcare", "Education", "Logistics", "Other"];

export default function Onboarding() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", industry: INDUSTRIES[0], description: "", currency: "USD" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function finish() {
    setBusy(true); setErr(null);
    const { error } = await createClient().rpc("create_organization", { p_name: f.name, p_industry: f.industry, p_description: f.description, p_stage: "active", p_existing: true, p_currency: f.currency, p_horizon: 12 });
    if (error) { setErr(error.message); setBusy(false); return; }
    router.push("/app/data"); router.refresh();
  }
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-extrabold">Set up your workspace</h1>
      <p className="mt-2 text-sm text-muted">Two minutes. Next you&apos;ll upload your sales data and get your first briefing.</p>
      <div className="card mt-6 space-y-4 p-6">
        <Field label="Company or team name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Industry"><select className="input" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })}>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="What do you sell, and to whom?" hint="Optional. Helps the AI describe your business correctly."><textarea className="input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Reporting currency"><select className="input" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{CURRENCIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy || f.name.trim().length < 2} onClick={finish}>{busy ? "Creating…" : "Create workspace"}</button>
      </div>
    </div>
  );
}
