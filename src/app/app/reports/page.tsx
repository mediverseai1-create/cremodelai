import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { loadModelSummaries } from "@/lib/load-models";
import { Empty, Panel } from "@/components/ui";

export const metadata = { title: "Reports" };
const REPORTS: [string, string][] = [
  ["Financial projections", "projections"], ["Profitability", "profitability"], ["Break-even", "breakeven"], ["Cash-flow forecast", "cashflow"],
  ["Scenario comparison", "scenarios"], ["Funding requirements", "funding"], ["Business plan", "plan"], ["Executive summary", "reports"],
];
export default async function Page() {
  const { supabase, org } = await getAppContext();
  const models = await loadModelSummaries(supabase, org.id);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Reports</h1>
      <p className="max-w-3xl text-sm text-muted">Reports are generated from each model&apos;s calculated results. Export CSV from the relevant tab, or use Print to save a PDF.</p>
      {models.length === 0 ? <Empty title="No models to report on" body="Create a model first." action={<Link href="/app/models" className="btn btn-primary">Create a model</Link>} /> :
        models.map((m) => (
          <Panel key={m.id} title={m.name}>
            <div className="flex flex-wrap gap-2">{REPORTS.map(([label, tab]) => <Link key={tab} href={`/app/models/${m.id}?tab=${tab}`} className="btn btn-ghost">{label}</Link>)}</div>
          </Panel>))}
    </div>
  );
}
