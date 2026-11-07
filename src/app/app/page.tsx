import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { loadModelSummaries } from "@/lib/load-models";
import { money } from "@/lib/format";
import { Empty, Panel, Stat } from "@/components/ui";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const { supabase, org } = await getAppContext();
  const models = await loadModelSummaries(supabase, org.id);
  const same = models.filter((m) => m.currency === org.currency && m.valid);
  const mixed = models.length - same.length;
  const [{ data: history }, { data: insights }, { data: actions }] = await Promise.all([
    supabase.from("model_change_history").select("summary,created_at,model_id").eq("org_id", org.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("ai_insights").select("title,body,created_at,model_id").eq("org_id", org.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("recommended_actions").select("id,title,priority,status").eq("org_id", org.id).in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(5),
  ]);
  const c = org.currency;
  const sum = (f: (m: (typeof same)[number]) => number) => same.reduce((a, m) => a + f(m), 0);

  if (models.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-extrabold">Welcome to {org.name}</h1>
        <Empty title="Build your first financial model" body="Enter your products, costs, staffing, investment and funding. CreModelAI will project revenue, profit, cash flow and break-even, then let you test scenarios."
          action={<Link href="/app/models" className="btn btn-primary">Create a business model</Link>} />
        <p className="text-sm text-muted">Want to explore first? <Link className="underline" href="/demo">Open the demonstration model</Link> (clearly labelled sample data).</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-extrabold">Overview</h1><p className="text-sm text-muted">Totals across {same.length} active model{same.length === 1 ? "" : "s"} in {c}, calculated from your saved assumptions.{mixed > 0 && ` ${mixed} model(s) in other currencies or with invalid inputs are excluded from totals.`}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Saved models" value={models.length} />
        <Stat label="Projected revenue" value={money(sum((m) => m.revenue), c, true)} sub="Over each model's horizon" />
        <Stat label="Operating profit" value={money(sum((m) => m.operatingProfit), c, true)} tone={sum((m) => m.operatingProfit) >= 0 ? "good" : "bad"} />
        <Stat label="Funding gap" value={money(sum((m) => m.fundingGap), c, true)} tone={sum((m) => m.fundingGap) > 0 ? "bad" : "good"} sub="Sum of per-model gaps" />
      </div>
      <Panel title="Models at a glance">
        <table className="tbl"><thead><tr><th>Model</th><th className="r">Revenue</th><th className="r">Op. profit</th><th className="r">Break-even / mo</th><th className="r">Lowest cash</th><th>Status</th></tr></thead><tbody>
          {models.map((m) => (<tr key={m.id}><td><Link className="font-semibold text-forest underline" href={`/app/models/${m.id}`}>{m.name}</Link></td><td className="r num">{money(m.revenue, m.currency, true)}</td><td className={`r num ${m.operatingProfit < 0 ? "text-bad" : ""}`}>{money(m.operatingProfit, m.currency, true)}</td><td className="r num">{money(m.breakEvenRevenue, m.currency, true)}</td><td className={`r num ${m.minCash < 0 ? "text-bad" : ""}`}>{money(m.minCash, m.currency, true)}</td>
            <td>{m.fundingGap > 0 ? <span className="tag tag-unver">Funding gap</span> : m.firstProfitableMonth ? <span className="tag tag-calc">Profitable m{m.firstProfitableMonth}</span> : <span className="tag tag-assume">Not yet profitable</span>}</td></tr>))}
        </tbody></table>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Recent model changes">{history?.length ? <ul className="space-y-2 text-sm">{history.map((h, i) => <li key={i}>{h.summary}<span className="block text-xs text-muted">{new Date(h.created_at).toLocaleString()}</span></li>)}</ul> : <p className="text-sm text-muted">No changes yet.</p>}</Panel>
        <Panel title="AI insights" actions={<Link className="text-sm underline" href="/app/insights">All</Link>}>{insights?.length ? <ul className="space-y-2 text-sm">{insights.map((i, k) => <li key={k}><b>{i.title}</b><p className="line-clamp-3 text-muted">{(i.body as { summary?: string }).summary}</p></li>)}</ul> : <p className="text-sm text-muted">No AI analyses run yet. Open a model and use the AI analysis tab.</p>}</Panel>
        <Panel title="Recommended actions" actions={<Link className="text-sm underline" href="/app/actions">All</Link>}>{actions?.length ? <ul className="space-y-2 text-sm">{actions.map((a) => <li key={a.id}>{a.title} <span className="tag tag-assume">{a.priority}</span></li>)}</ul> : <p className="text-sm text-muted">No open actions.</p>}</Panel>
      </div>
    </div>
  );
}
