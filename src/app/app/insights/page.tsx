import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { AnalysisView } from "@/components/AiPanel";
import { Empty } from "@/components/ui";
import type { Analysis } from "@/lib/ai/agents";

export const metadata = { title: "AI Insights" };
export default async function Page() {
  const { supabase, org } = await getAppContext();
  const { data } = await supabase.from("ai_insights").select("id,agent,title,body,created_at,model_id,business_models(name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(20);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">AI Insights</h1>
      <p className="max-w-3xl text-sm text-muted">Each insight is an AI interpretation of calculated model results, labelled with the type of evidence behind every finding. Insights are not guarantees and are not financial advice.</p>
      {!data?.length ? <Empty title="No insights yet" body="Run an analysis from a model's AI analysis tab. Results are saved here." action={<Link className="btn btn-primary" href="/app/go/ai">Open AI analysis</Link>} /> :
        data.map((i) => (
          <details key={i.id} className="card p-5" open={data[0].id === i.id}>
            <summary className="cursor-pointer font-display font-bold">{i.title} <span className="text-sm font-normal text-muted">· {(i.business_models as unknown as { name: string } | null)?.name} · {new Date(i.created_at).toLocaleString()}</span></summary>
            <div className="mt-4"><AnalysisView a={i.body as Analysis} modelId={i.model_id} orgId={org.id} /></div>
          </details>))}
    </div>
  );
}
