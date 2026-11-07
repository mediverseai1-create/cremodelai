import { getAppContext } from "@/lib/app-context";
import { AGENTS } from "@/lib/ai/agents";
import { aiConfigured } from "@/lib/ai/gemini";
import { Panel } from "@/components/ui";

export const metadata = { title: "AI Agents" };
export default async function Page() {
  const { supabase, org } = await getAppContext();
  const { data: runs } = await supabase.from("ai_agent_runs").select("id,agent,status,error,duration_ms,created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(200);
  const stats = new Map<string, { n: number; err: number; last?: string }>();
  (runs ?? []).forEach((r) => { const s = stats.get(r.agent) ?? { n: 0, err: 0 }; s.n++; if (r.status === "error") s.err++; s.last ??= r.created_at; stats.set(r.agent, s); });
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">AI Agents</h1>
      <p className={`rounded-lg p-3 text-sm ${aiConfigured() ? "bg-emerald-50 text-good" : "bg-amber-50 text-warn"}`}>{aiConfigured() ? "Gemini is configured." : "Gemini is not configured (GEMINI_API_KEY missing). Agents are unavailable; calculations, scenarios and exports still work."}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(AGENTS).map((a) => { const s = stats.get(a.key); return (
          <Panel key={a.key} title={a.label} note={a.purpose}>
            <p className="text-xs text-muted">{s ? `${s.n} recent runs · ${s.err} errors · last ${new Date(s.last!).toLocaleString()}` : "No runs yet."}</p>
          </Panel>); })}
      </div>
      <p className="text-xs text-muted">Run agents from a model&apos;s AI analysis tab, Business plan tab or Ask CreModelAI. Agents only read saved data and never edit assumptions.</p>
    </div>
  );
}
