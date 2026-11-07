"use client";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { callAi } from "./AiPanel";
import { Evidence, Panel } from "./ui";

const EXAMPLES = ["Is my business model financially viable?", "What is my break-even point?", "How much capital do I need to launch?", "What happens if sales are 20% below expectations?", "Which expenses have the biggest impact on profitability?", "What assumptions should I validate before launching?", "How long will our current cash last?"];

interface Turn { q: string; a?: { answer: string; references: string[]; missingInformation: string[] }; error?: string }

export default function AskClient({ models }: { models: { id: string; name: string }[] }) {
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(text: string) {
    if (!text.trim() || !modelId) return;
    setBusy(true); setQ("");
    const idx = turns.length;
    setTurns((t) => [...t, { q: text }]);
    try {
      const a = await callAi({ agent: "ask", modelId, question: text });
      setTurns((t) => t.map((x, i) => (i === idx ? { ...x, a } : x)));
    } catch (e) { setTurns((t) => t.map((x, i) => (i === idx ? { ...x, error: e instanceof Error ? e.message : "Failed" } : x))); }
    finally { setBusy(false); }
  }
  if (!models.length) return <Panel title="Ask CreModelAI"><p className="text-sm text-muted">Create and save a business model first. Answers are based only on your saved models.</p></Panel>;
  return (
    <Panel title="Ask CreModelAI" note="Answers use the calculated results and assumptions of the selected model's saved version. The AI interprets; it does not invent figures or market evidence.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="label !mb-0" htmlFor="m">Model</label>
        <select id="m" className="input w-auto" value={modelId} onChange={(e) => setModelId(e.target.value)}>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">{EXAMPLES.map((x) => <button key={x} className="btn btn-ghost !py-1 !text-xs" disabled={busy} onClick={() => ask(x)}>{x}</button>)}</div>
      <div className="space-y-4" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <p className="ml-auto max-w-xl rounded-xl bg-forest p-3 text-sm text-white">{t.q}</p>
            {!t.a && !t.error && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" /> Analysing your model…</p>}
            {t.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-bad">{t.error}</p>}
            {t.a && <div className="card p-4 text-sm"><Evidence kind="interpretation" /><p className="mt-2 whitespace-pre-wrap leading-relaxed">{t.a.answer}</p>
              {t.a.references.length > 0 && <p className="mt-3 text-xs text-muted"><b>Based on:</b> {t.a.references.join(" · ")}</p>}
              {t.a.missingInformation.length > 0 && <p className="mt-1 text-xs text-warn"><b>Missing:</b> {t.a.missingInformation.join("; ")}</p>}</div>}
          </div>))}
      </div>
      <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="input" placeholder="Ask about your business model…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Question" />
        <button className="btn btn-primary" disabled={busy || !q.trim()}><Send size={14} /> Ask</button>
      </form>
    </Panel>
  );
}
