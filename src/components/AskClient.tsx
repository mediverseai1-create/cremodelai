"use client";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { callAi } from "@/lib/ai-client";
import { Evidence, Panel } from "./ui";

const EXAMPLES = ["Which customers are buying less than last period?", "Which product grew the most?", "Where is my revenue most concentrated?", "Which rep is falling behind?", "What should my team do this week?", "How much revenue is at risk?"];
interface Ans { answer: string; references: string[]; missingInformation: string[] }
interface Turn { q: string; a?: Ans; error?: string }

export default function AskClient({ hasData }: { hasData: boolean }) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  async function ask(text: string) {
    if (!text.trim()) return;
    setBusy(true); setQ("");
    const idx = turns.length;
    setTurns((t) => [...t, { q: text }]);
    try { const r = await callAi<Ans>({ agent: "ask", question: text, cadence: "monthly" }); setTurns((t) => t.map((x, i) => (i === idx ? { ...x, a: r.result } : x))); }
    catch (e) { setTurns((t) => t.map((x, i) => (i === idx ? { ...x, error: e instanceof Error ? e.message : "Failed" } : x))); }
    finally { setBusy(false); }
  }
  if (!hasData) return <Panel title="Ask in plain language"><p className="text-sm text-muted">Upload sales data first. Answers come only from your own data, with the numbers they came from.</p></Panel>;
  return (
    <Panel title="Ask in plain language" note="Answers use your sales data (latest month compared with the one before) and your open pipeline, and show the figures they came from.">
      <div className="mb-4 flex flex-wrap gap-2">{EXAMPLES.map((x) => <button key={x} className="btn btn-ghost !py-1 !text-xs" disabled={busy} onClick={() => ask(x)}>{x}</button>)}</div>
      <div className="space-y-4" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <p className="ml-auto max-w-xl rounded-xl bg-forest p-3 text-sm text-white">{t.q}</p>
            {!t.a && !t.error && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" /> Reading your data… this can take up to a minute.</p>}
            {t.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-bad">{t.error}</p>}
            {t.a && <div className="card p-4 text-sm"><Evidence kind="interpretation" /><p className="mt-2 whitespace-pre-wrap leading-relaxed">{t.a.answer}</p>
              {t.a.references.length > 0 && <p className="mt-3 text-xs text-muted"><b>Numbers used:</b> {t.a.references.join(" · ")}</p>}
              {t.a.missingInformation.length > 0 && <p className="mt-1 text-xs text-warn"><b>Missing:</b> {t.a.missingInformation.join("; ")}</p>}</div>}
          </div>))}
      </div>
      <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input" placeholder="Ask the way you'd say it out loud…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Question" />
        <button className="btn btn-primary" disabled={busy || !q.trim()}><Send size={14} /> Ask</button>
      </form>
    </Panel>
  );
}
