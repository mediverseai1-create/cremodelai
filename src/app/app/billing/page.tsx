import { getAppContext } from "@/lib/app-context";
import { PLANS, USAGE_LABELS, paymentLink, type PlanKey, type UsageKind } from "@/lib/plans";
import { Panel } from "@/components/ui";

export const metadata = { title: "Usage & Billing" };
export default async function Page() {
  const { supabase, org, isAdmin } = await getAppContext();
  const { data: sub } = await supabase.from("subscriptions").select("plan,status,current_period_end").eq("org_id", org.id).maybeSingle();
  const since = new Date(new Date().getTime() - 30 * 86400_000).toISOString();
  const { data: usage } = await supabase.from("usage_records").select("kind,quantity").eq("org_id", org.id).gte("created_at", since);
  const totals = new Map<string, number>();
  (usage ?? []).forEach((u) => totals.set(u.kind, (totals.get(u.kind) ?? 0) + u.quantity));
  const active = sub?.status === "active";
  const plan = (active ? sub!.plan : "free") as PlanKey;
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Usage &amp; Billing</h1>
      <Panel title="Current plan"><p className="text-lg"><b className="font-display">{PLANS[plan].name}</b> <span className="tag tag-calc">{active ? "Active" : sub?.status ?? "No paid subscription"}</span></p>
        {sub?.current_period_end && <p className="text-sm text-muted">Renews / ends {new Date(sub.current_period_end).toLocaleDateString()}</p>}
        <p className="mt-2 text-xs text-muted">Plans activate only after trusted payment confirmation, never from returning from the payment page. Contact support after paying if your plan has not updated.</p></Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {(["professional", "enterprise"] as const).map((k) => { const link = paymentLink(k); const p = PLANS[k]; return (
          <section key={k} className={`card p-6 ${plan === k ? "border-forest" : ""}`}>
            <h2 className="font-display text-xl font-bold">{p.name}</h2><p className="num font-display text-3xl font-extrabold">${p.priceMonthly}<span className="text-base font-medium text-muted">/month</span></p>
            <ul className="my-3 list-disc pl-5 text-sm text-muted">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {plan === k ? <span className="tag tag-calc">Your plan</span> : link && isAdmin ? <a className="btn btn-primary" href={link} target="_blank" rel="noopener noreferrer">{k === "professional" ? "Choose Professional" : "Choose Enterprise"}</a> : <button className="btn btn-primary" disabled>{link ? "Owner or administrator required" : "Payment link not configured"}</button>}
          </section>); })}
      </div>
      <Panel title="Usage (last 30 days)" note="Usage is tracked server-side. Plan limits are not set yet; they will be enforced once configured in plan settings.">
        <table className="tbl"><thead><tr><th>Activity</th><th className="r">Used</th><th className="r">Limit</th></tr></thead><tbody>
          {(Object.keys(USAGE_LABELS) as UsageKind[]).map((k) => { const lim = PLANS[plan].limits[k]; return (<tr key={k}><td>{USAGE_LABELS[k]}</td><td className="r num">{totals.get(k) ?? 0}</td><td className="r">{typeof lim === "number" ? lim : "Not configured"}</td></tr>); })}
        </tbody></table>
      </Panel>
      <Panel title="Billing history"><p className="text-sm text-muted">Invoices come from your payment provider. History will appear here once payment confirmation is connected.</p></Panel>
    </div>
  );
}
