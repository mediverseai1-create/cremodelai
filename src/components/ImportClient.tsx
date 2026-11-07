"use client";
import { useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { modelInputsSchema, type ModelInputs } from "@/lib/engine/types";
import { uid } from "@/lib/format";
import { Field, Panel } from "./ui";

type Cat = "products" | "fixedCosts" | "staff" | "investments";
const FIELDS: Record<Cat, { key: string; label: string; required: boolean; hints: string[] }[]> = {
  products: [
    { key: "name", label: "Name", required: true, hints: ["name", "product", "item", "service"] },
    { key: "price", label: "Price", required: true, hints: ["price", "unit price", "selling"] },
    { key: "unitCost", label: "Unit cost", required: true, hints: ["cost", "unit cost", "cogs"] },
    { key: "startVolume", label: "Month-1 volume", required: true, hints: ["volume", "units", "qty", "quantity"] },
  ],
  fixedCosts: [
    { key: "name", label: "Name", required: true, hints: ["name", "expense", "description", "item"] },
    { key: "monthly", label: "Monthly amount", required: true, hints: ["monthly", "amount", "cost"] },
  ],
  staff: [
    { key: "role", label: "Role", required: true, hints: ["role", "title", "position", "employee"] },
    { key: "monthlySalary", label: "Monthly salary", required: true, hints: ["salary", "pay", "monthly"] },
    { key: "headcount", label: "Headcount", required: false, hints: ["headcount", "count", "number"] },
  ],
  investments: [
    { key: "name", label: "Name", required: true, hints: ["name", "item", "description"] },
    { key: "amount", label: "Amount", required: true, hints: ["amount", "cost", "value"] },
  ],
};
const CAT_LABEL: Record<Cat, string> = { products: "Products & pricing", fixedCosts: "Fixed costs", staff: "Staffing / payroll", investments: "Investments / setup costs" };

type Status = "ok" | "rejected" | "review" | "duplicate";
interface PreviewRow { status: Status; reason?: string; row: Record<string, unknown> }

const toNum = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, "")); return String(v ?? "").trim() === "" || Number.isNaN(n) ? NaN : n; };

export default function ImportClient({ models, orgId, userId, canEdit }: { models: { id: string; name: string }[]; orgId: string; userId: string; canEdit: boolean }) {
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [cat, setCat] = useState<Cat>("products");
  const [file, setFile] = useState<File | null>(null);
  const [wb, setWb] = useState<XLSX.WorkBook | null>(null);
  const [sheet, setSheet] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);

  async function onFile(f: File) {
    setMsg(null); setFile(f); setRows([]); setWb(null);
    if (/\.pdf$/i.test(f.name)) { setMsg({ ok: false, text: "PDF extraction is Coming Soon. Export the table to CSV or XLSX and import that." }); setFile(null); return; }
    if (f.size > 8 * 1024 * 1024) { setMsg({ ok: false, text: "File is larger than 8 MB." }); setFile(null); return; }
    if (/\.csv$/i.test(f.name)) {
      Papa.parse<Record<string, unknown>>(f, { header: true, skipEmptyLines: true, complete: (r) => { setRows(r.data); autoMap(r.data, cat); } });
    } else if (/\.xlsx?$/i.test(f.name)) {
      const book = XLSX.read(await f.arrayBuffer());
      setWb(book); setSheet(book.SheetNames[0]); loadSheet(book, book.SheetNames[0], cat);
    } else { setMsg({ ok: false, text: "Unsupported file type. Use CSV or XLSX." }); setFile(null); }
  }
  function loadSheet(book: XLSX.WorkBook, name: string, c: Cat) {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[name], { defval: "" });
    setRows(data); autoMap(data, c);
  }
  function autoMap(data: Record<string, unknown>[], c: Cat) {
    const hs = Object.keys(data[0] ?? {});
    const m: Record<string, string> = {};
    for (const fld of FIELDS[c]) m[fld.key] = hs.find((h) => fld.hints.some((x) => h.toLowerCase().includes(x))) ?? "";
    setMap(m);
  }

  const existing = useMemo(() => new Set<string>(), []);
  const preview: PreviewRow[] = useMemo(() => {
    const seen = new Set(existing);
    return rows.map((r) => {
      const out: Record<string, unknown> = {};
      const problems: string[] = [];
      for (const fld of FIELDS[cat]) {
        const raw = map[fld.key] ? r[map[fld.key]] : undefined;
        const isText = fld.key === "name" || fld.key === "role";
        if (raw === undefined || String(raw).trim() === "") { if (fld.required) problems.push(`missing ${fld.label}`); continue; }
        if (isText) out[fld.key] = String(raw).trim();
        else { const n = toNum(raw); if (Number.isNaN(n) || n < 0) problems.push(`invalid ${fld.label}`); else out[fld.key] = n; }
      }
      if (problems.length) return { status: "rejected" as Status, reason: problems.join(", "), row: out };
      const key = String(out.name ?? out.role).toLowerCase();
      if (seen.has(key)) return { status: "duplicate" as Status, reason: "Same name appears more than once", row: out };
      seen.add(key);
      if (cat === "products" && Number(out.unitCost) > Number(out.price)) return { status: "review" as Status, reason: "Unit cost exceeds price", row: out };
      return { status: "ok" as Status, row: out };
    });
  }, [rows, map, cat, existing]);
  const count = (s: Status) => preview.filter((p) => p.status === s).length;

  async function confirm() {
    if (!modelId || !file) return;
    setBusy(true); setMsg(null);
    try {
      const sb = createClient();
      const { data: m } = await sb.from("business_models").select("current_version_id").eq("id", modelId).single();
      const { data: v } = await sb.from("financial_model_versions").select("inputs,version_number").eq("id", m!.current_version_id).single();
      const cur = modelInputsSchema.parse(v!.inputs);
      const take = preview.filter((p) => p.status === "ok" || p.status === "review").map((p) => p.row);
      const clash = new Set((cur[cat] as { name?: string; role?: string }[]).map((x) => (x.name ?? x.role ?? "").toLowerCase()));
      const fresh = take.filter((r) => !clash.has(String(r.name ?? r.role).toLowerCase()));
      const skipped = take.length - fresh.length;
      const built = fresh.map((r) => {
        const id = uid();
        if (cat === "products") return { id, kind: "product", monthlyGrowthPct: 0, discountPct: 0, ...r };
        if (cat === "fixedCosts") return { id, category: "other", annualGrowthPct: 0, ...r };
        if (cat === "staff") return { id, department: "General", headcount: 1, benefitsPct: 0, startMonth: 1, ...r };
        return { id, month: 1, ...r };
      });
      const next = { ...cur, [cat]: [...(cur[cat] as unknown[]), ...built] } as ModelInputs;
      const check = modelInputsSchema.safeParse(next);
      if (!check.success) throw new Error(`Imported rows failed validation: ${check.error.issues[0]?.message}`);
      const path = `${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      await sb.storage.from("imports").upload(path, file); // original file preserved
      const { data: nv, error } = await sb.from("financial_model_versions").insert({ org_id: orgId, model_id: modelId, version_number: v!.version_number + 1, inputs: check.data, created_by: userId, note: `Import: ${file.name}` }).select("id").single();
      if (error) throw error;
      await sb.from("business_models").update({ current_version_id: nv.id, updated_at: new Date().toISOString() }).eq("id", modelId);
      const summary = { imported: fresh.length, rejected: count("rejected"), review: count("review"), duplicates: count("duplicate") + skipped };
      await sb.from("data_imports").insert({ org_id: orgId, model_id: modelId, file_name: file.name, storage_path: path, category: cat, mapping: map, summary, status: "imported", created_by: userId });
      await sb.from("model_change_history").insert({ org_id: orgId, model_id: modelId, user_id: userId, summary: `Imported ${fresh.length} ${CAT_LABEL[cat].toLowerCase()} from ${file.name}`, detail: summary });
      setMsg({ ok: true, text: `Imported ${fresh.length} rows as a new model version. ${summary.rejected} rejected, ${summary.duplicates} duplicates skipped, ${summary.review} flagged for review (imported — please check them).` });
      setRows([]); setFile(null);
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Import failed" }); } finally { setBusy(false); }
  }

  if (!models.length) return <Panel title="Data & imports"><p className="text-sm text-muted">Create a business model first, then import spreadsheets into it.</p></Panel>;
  return (
    <div className="space-y-5">
      <Panel title="Import a spreadsheet" note="CSV or XLSX. Map columns, review what will be imported, then confirm. Rows are never silently dropped: rejected, duplicate and review-needed rows are listed. The original file is stored privately. PDF extraction is Coming Soon.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Target model"><select className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <Field label="What is in the file?"><select className="input" value={cat} onChange={(e) => { const c = e.target.value as Cat; setCat(c); autoMap(rows, c); }}>{(Object.keys(CAT_LABEL) as Cat[]).map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}</select></Field>
          <Field label="File"><input className="input" type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></Field>
        </div>
        {wb && wb.SheetNames.length > 1 && <Field label="Worksheet"><select className="input mt-3 max-w-xs" value={sheet} onChange={(e) => { setSheet(e.target.value); loadSheet(wb, e.target.value, cat); }}>{wb.SheetNames.map((s) => <option key={s}>{s}</option>)}</select></Field>}
        {msg && <p role="status" className={`mt-3 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-good" : "bg-red-50 text-bad"}`}>{msg.text}</p>}
      </Panel>
      {rows.length > 0 && (
        <>
          <Panel title="Map columns">
            <div className="grid gap-4 md:grid-cols-4">{FIELDS[cat].map((f) => (
              <Field key={f.key} label={`${f.label}${f.required ? " *" : ""}`}><select className="input" value={map[f.key] ?? ""} onChange={(e) => setMap({ ...map, [f.key]: e.target.value })}><option value="">— not mapped —</option>{headers.map((h) => <option key={h}>{h}</option>)}</select></Field>))}</div>
          </Panel>
          <Panel title="Preview" actions={<button className="btn btn-primary" disabled={busy || !canEdit || count("ok") + count("review") === 0} onClick={confirm}>{busy ? "Importing…" : `Confirm import (${count("ok") + count("review")} rows)`}</button>}>
            <p className="mb-3 text-sm"><b className="text-good">{count("ok")}</b> ready · <b className="text-warn">{count("review")}</b> need review · <b className="text-bad">{count("rejected")}</b> rejected · <b>{count("duplicate")}</b> duplicates</p>
            <div className="max-h-96 overflow-auto"><table className="tbl"><thead><tr><th>#</th><th>Status</th>{FIELDS[cat].map((f) => <th key={f.key}>{f.label}</th>)}<th>Note</th></tr></thead><tbody>
              {preview.slice(0, 200).map((p, i) => (<tr key={i}><td>{i + 1}</td><td><span className={`tag ${p.status === "ok" ? "tag-calc" : p.status === "review" ? "tag-assume" : "tag-unver"}`}>{p.status}</span></td>{FIELDS[cat].map((f) => <td key={f.key}>{String(p.row[f.key] ?? "—")}</td>)}<td className="text-muted">{p.reason}</td></tr>))}
            </tbody></table></div>
            {rows.length > 200 && <p className="mt-2 text-xs text-muted">Showing the first 200 of {rows.length} rows; all rows are processed on import.</p>}
          </Panel>
        </>
      )}
    </div>
  );
}
