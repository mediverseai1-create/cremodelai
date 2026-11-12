import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { computeMetrics, followUpStatus } from "@/lib/revenue/analytics";
import { loadSales } from "@/lib/revenue/load";
import { MetricsView } from "@/components/BriefingView";
import { Empty, Panel, Stat } from "@/components/ui";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const { supabase, org } = await getAppContext();
  const { rows } = await loadSales(supabase, org.id);
  const [{ data: actions }, { data: deals }, { data: brief }] = await Promise.all([
    supabase.from("recommended_actions").select("id,title,priority").eq("org_id", org.id).in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(5),
    supabase.from("pipeline_deals").select("id,name,stage,follow_up_on,last_contact,value").eq("org_id", org.id),
    supabase.from("briefings").select("id,cadence,created_at,content").eq("org_id", org.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-extrabold">Welcome to {org.name}</h1>
        <Empty title="Upload your sales data" body="Add a CSV or Excel export of your sales. You get your first briefing and a queue of next best actions back." action={<Link href="/app/data" className="btn btn-primary">Upload sales data</Link>} />
        <p className="text-sm text-muted">Want to look around first? <Link className="underline" href="/demo">Open the sample-data demo</Link>.</p>
      </div>
    );
  }
  const m = computeMetrics(rows, "monthly");
  const t = new Date().toISOString().slice(0, 10);
  const due = (deals ?? []).filter((d) => ["overdue", "due-today"].includes(followUpStatus(d, t))).length;
  const open = (deals ?? []).filter((d) => !["won", "lost"].includes(d.stage));
  const headline = (brief?.content as { headline?: string } | null)?.headline;
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-extrabold">Overview</h1><p className="text-sm text-muted">Latest 30 days of your data, compared with the 30 days before. Figures are calculated from your uploaded sales.</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Open pipeline" value={open.length} sub="deals in progress" />
        <Stat label="Follow-ups due" value={due} tone={due > 0 ? "warn" : "good"} sub="overdue or due today" />
        <Stat label="Open actions" value={actions?.length ?? 0} sub="in your queue" />
      </div>
      <Panel title="Latest briefing" actions={<Link className="text-sm underline" href="/app/briefings">All briefings</Link>}>
        {brief ? <p className="text-sm"><b>{headline ?? `${brief.cadence} briefing`}</b><span className="block text-muted">{new Date(brief.created_at).toLocaleString()}</span></p> : <p className="text-sm text-muted">No briefing yet. <Link className="underline" href="/app/briefings">Generate your first one.</Link></p>}
      </Panel>
      <MetricsView m={m} cur={org.currency} />
      <Panel title="Next best actions" actions={<Link className="text-sm underline" href="/app/actions">Open queue</Link>}>
        {actions?.length ? <ul className="space-y-2 text-sm">{actions.map((a) => <li key={a.id}>{a.title} <span className="tag tag-assume">{a.priority}</span></li>)}</ul> : <p className="text-sm text-muted">Queue is clear.</p>}
      </Panel>
    </div>
  );
}
