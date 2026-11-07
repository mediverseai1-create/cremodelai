"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/engine/types";
import { createModel, emptyInputs } from "@/lib/models";
import { Field } from "./ui";

const INDUSTRIES = ["Retail & e-commerce", "Software / SaaS", "Professional services", "Food & beverage", "Manufacturing", "Health & wellness", "Education", "Agriculture", "Logistics", "Other"];
const STAGES = ["Idea", "Pre-launch", "Early revenue", "Growing", "Established"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name: "", industry: INDUSTRIES[0], description: "", stage: STAGES[0], existing: false, currency: "USD", horizon: 24, modelName: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });

  async function finish() {
    setBusy(true); setErr(null);
    try {
      const sb = createClient();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: orgId, error } = await sb.rpc("create_organization", { p_name: f.name, p_industry: f.industry, p_description: f.description, p_stage: f.stage, p_existing: f.existing, p_currency: f.currency, p_horizon: f.horizon });
      if (error) throw error;
      const modelId = await createModel(sb, orgId as string, u.user.id, f.modelName || `${f.name} — base model`, emptyInputs(f.currency, f.horizon), { industry: f.industry, description: f.description });
      router.push(`/app/models/${modelId}?tab=revenue`); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Setup failed"); setBusy(false); }
  }
  const valid1 = f.name.trim().length > 1;
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-semibold text-muted">Step {step} of 3</p>
      <h1 className="font-display text-3xl font-extrabold">{step === 1 ? "Tell us about your business" : step === 2 ? "Set your modeling basics" : "Create your first model"}</h1>
      <div className="card mt-6 space-y-4 p-6">
        {step === 1 && <>
          <Field label="Business name"><input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Industry"><select className="input" value={f.industry} onChange={(e) => set({ industry: e.target.value })}>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="What does the business do?"><textarea className="input" rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        </>}
        {step === 2 && <>
          <Field label="Business stage"><select className="input" value={f.stage} onChange={(e) => set({ stage: e.target.value })}>{STAGES.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Is this a new or existing business?"><select className="input" value={f.existing ? "existing" : "new"} onChange={(e) => set({ existing: e.target.value === "existing" })}><option value="new">New business</option><option value="existing">Existing business</option></select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary currency"><select className="input" value={f.currency} onChange={(e) => set({ currency: e.target.value })}>{CURRENCIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Planning horizon"><select className="input" value={f.horizon} onChange={(e) => set({ horizon: Number(e.target.value) })}>{[12, 24, 36, 48, 60].map((x) => <option key={x} value={x}>{x} months</option>)}</select></Field>
          </div>
        </>}
        {step === 3 && <>
          <Field label="Model name"><input className="input" placeholder={`${f.name} — base model`} value={f.modelName} onChange={(e) => set({ modelName: e.target.value })} /></Field>
          <p className="text-sm text-muted">We&apos;ll open an empty workspace so you can enter your own assumptions (products, costs, staffing, investment, funding). You can also import a spreadsheet from Data &amp; Imports. Nothing is pre-filled with invented numbers.</p>
        </>}
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <div className="flex justify-between pt-2">
          <button className="btn btn-ghost" disabled={step === 1 || busy} onClick={() => setStep(step - 1)}>Back</button>
          {step < 3 ? <button className="btn btn-primary" disabled={!valid1} onClick={() => setStep(step + 1)}>Continue</button>
            : <button className="btn btn-primary" disabled={busy} onClick={finish}>{busy ? "Creating…" : "Create workspace"}</button>}
        </div>
      </div>
    </div>
  );
}
