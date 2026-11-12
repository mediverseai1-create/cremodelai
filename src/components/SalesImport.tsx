"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { download } from "@/lib/format";
import { Field, Panel } from "./ui";

const FIELDS = [
  { key: "date", label: "Date", required: true, hints: ["date", "sold", "day", "period"] },
  { key: "customer", label: "Customer", required: true, hints: ["customer", "client", "account", "company", "buyer"] },
  { key: "amount", label: "Amount", required: true, hints: ["amount", "revenue", "total", "value", "sales", "price"] },
  { key: "product", label: "Product", required: false, hints: ["product", "item", "sku", "service"] },
  { key: "region", label: "Region", required: false, hints: ["region", "territory", "country", "city", "area"] },
  { key: "rep", label: "Rep", required: false, hints: ["rep", "owner", "salesperson", "seller", "agent"] },
] as const;
type Key = (typeof FIELDS)[number]["key"];
type Status = "ok" | "rejected" | "duplicate";
interface Row { status: Status; reason?: string; v: { date: string; customer: string; amount: number; product: string | null; region: string | null; rep: string | null } | null; raw: Record<string, unknown> }

function normDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) { // day-first only when the first part cannot be a month
    const [a, b, y] = [Number(m[1]), Number(m[2]), m[3]];
    const [mo, d] = a > 12 ? [b, a] : [a, b];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}
const toNum = (v: unknown) => { const t = String(v ?? "").trim(); if (!t) return NaN; const neg = /^\(.*\)$/.test(t); const n = Number(t.replace(/[^0-9.\-]/g, "")); return neg ? -Math.abs(n) : n; };

export default function SalesImport({ orgId, userId, canEdit, existing }: { orgId: string; userId: string; canEdit: boolean; existing: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [wb, setWb] = useState<XLSX.WorkBook | null>(null);
  const [sheet, setSheet] = useState("");
  const [raw, setRaw] = useState<Record<string, unknown>[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const headers = useMemo(() => Object.keys(raw[0] ?? {}), [raw]);

  function autoMap(data: Record<string, unknown>[]) {
    const hs = Object.keys(data[0] ?? {});
    const m: Record<string, string> = {};
    for (const f of FIELDS) m[f.key] = hs.find((h) => f.hints.some((x) => h.toLowerCase().includes(x))) ?? "";
    setMap(m);
  }
  function loadSheet(book: XLSX.WorkBook, name: string) {
    const d = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[name], { defval: "", raw: true });
    setRaw(d); autoMap(d);
  }
  async function onFile(f: File) {
    setMsg(null); setFile(f); setRaw([]); setWb(null);
    if (/\.pdf$/i.test(f.name)) { setMsg({ ok: false, t: "PDF extraction is Coming Soon. Export the table to CSV or XLSX and import that." }); setFile(null); return; }
    if (f.size > 15 * 1024 * 1024) { setMsg({ ok: false, t: "File is larger than 15 MB." }); setFile(null); return; }
    if (/\.csv$/i.test(f.name)) Papa.parse<Record<string, unknown>>(f, { header: true, skipEmptyLines: true, complete: (r) => { setRaw(r.data); autoMap(r.data); } });
    else if (/\.xlsx?$/i.test(f.name)) { const b = XLSX.read(await f.arrayBuffer(), { cellDates: true }); setWb(b); setSheet(b.SheetNames[0]); loadSheet(b, b.SheetNames[0]); }
    else { setMsg({ ok: false, t: "Unsupported file type. Use CSV or XLSX." }); setFile(null); }
  }

  const rows: Row[] = useMemo(() => {
    const seen = new Set<string>();
    const g = (r: Record<string, unknown>, k: Key) => (map[k] ? r[map[k]] : undefined);
    return raw.map((r) => {
      const problems: string[] = [];
      const date = normDate(g(r, "date")); if (!date) problems.push("invalid or missing date");
      const customer = String(g(r, "customer") ?? "").trim(); if (!customer) problems.push("missing customer");
      const amount = toNum(g(r, "amount")); if (Number.isNaN(amount)) problems.push("invalid or missing amount");
      if (problems.length) return { status: "rejected" as Status, reason: problems.join(", "), v: null, raw: r };
      const opt = (k: Key) => { const s = String(g(r, k) ?? "").trim(); return s || null; };
      const v = { date: date!, customer, amount, product: opt("product"), region: opt("region"), rep: opt("rep") };
      const key = [v.date, v.customer.toLowerCase(), v.amount, v.product ?? ""].join("|");
      if (seen.has(key)) return { status: "duplicate" as Status, reason: "Same date, customer, amount and product appears earlier in this file", v, raw: r };
      seen.add(key);
      return { status: "ok" as Status, v, raw: r };
    });
  }, [raw, map]);
  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  const missingRequired = FIELDS.filter((f) => f.required && !map[f.key]);

  async function confirm() {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const sb = createClient();
      const good = rows.filter((r) => r.status === "ok").map((r) => r.v!);
      const path = `${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      await sb.storage.from("imports").upload(path, file); // original file preserved
      const summary = { imported: good.length, rejected: count("rejected"), duplicates: count("duplicate") };
      const { data: imp, error: e0 } = await sb.from("data_imports").insert({ org_id: orgId, file_name: file.name, storage_path: path, category: "sales", mapping: map, summary, status: "imported", created_by: userId }).select("id").single();
      if (e0) throw e0;
      for (let i = 0; i < good.length; i += 500) {
        const batch = good.slice(i, i + 500).map((v) => ({ org_id: orgId, sold_at: v.date, customer: v.customer, product: v.product, region: v.region, rep: v.rep, amount: v.amount, import_id: imp.id }));
        const { error } = await sb.from("sales_records").insert(batch);
        if (error) throw error;
      }
      await sb.from("audit_logs").insert({ org_id: orgId, user_id: userId, action: "sales.imported", entity: "data_import", entity_id: imp.id, detail: summary });
      setMsg({ ok: true, t: `Imported ${good.length} rows. ${summary.rejected} rejected and ${summary.duplicates} duplicates were skipped. Generate your first briefing next.` });
      setRaw([]); setFile(null); router.refresh();
    } catch (e) { setMsg({ ok: false, t: e instanceof Error ? e.message : "Import failed" }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <Panel title="Upload sales data" note="CSV or XLSX. Needs a date, a customer and an amount per row; product, region and rep unlock deeper findings. You review a preview first. Rows with problems are listed, never silently dropped. The original file is stored privately. PDF extraction is Coming Soon."
        actions={<button className="btn btn-ghost" onClick={() => download("sales-template.csv", "date,customer,product,region,rep,amount\n2026-01-15,Example Co,Product A,North,Alex,1200\n")}>Download template</button>}>
        <p className="mb-3 text-sm text-muted">{existing > 0 ? `${existing.toLocaleString()} sales rows are already in this workspace. New uploads are added to them; re-uploading the same file will create duplicates.` : "No sales rows yet."}</p>
        <Field label="File"><input className="input max-w-md" type="file" accept=".csv,.xlsx,.xls,.pdf" disabled={!canEdit} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></Field>
        {wb && wb.SheetNames.length > 1 && <Field label="Worksheet"><select className="input mt-3 max-w-xs" value={sheet} onChange={(e) => { setSheet(e.target.value); loadSheet(wb, e.target.value); }}>{wb.SheetNames.map((s) => <option key={s}>{s}</option>)}</select></Field>}
        {msg && <p role="status" className={`mt-3 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-good" : "bg-red-50 text-bad"}`}>{msg.t}</p>}
      </Panel>
      {raw.length > 0 && (
        <>
          <Panel title="Match your columns">
            <div className="grid gap-4 md:grid-cols-3">{FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label}${f.required ? " *" : ""}`}><select className="input" value={map[f.key] ?? ""} onChange={(e) => setMap({ ...map, [f.key]: e.target.value })}><option value="">— not in file —</option>{headers.map((h) => <option key={h}>{h}</option>)}</select></Field>))}</div>
          </Panel>
          <Panel title="Preview" actions={<button className="btn btn-primary" disabled={busy || !canEdit || count("ok") === 0 || missingRequired.length > 0} onClick={confirm}>{busy ? "Importing…" : `Confirm import (${count("ok")} rows)`}</button>}>
            {missingRequired.length > 0 && <p className="mb-3 text-sm text-bad">Map the required columns: {missingRequired.map((f) => f.label).join(", ")}.</p>}
            <p className="mb-3 text-sm"><b className="text-good">{count("ok")}</b> ready · <b className="text-bad">{count("rejected")}</b> rejected · <b className="text-warn">{count("duplicate")}</b> duplicates</p>
            <div className="max-h-96 overflow-auto"><table className="tbl"><thead><tr><th>#</th><th>Status</th><th>Date</th><th>Customer</th><th className="r">Amount</th><th>Product</th><th>Note</th></tr></thead><tbody>
              {rows.slice(0, 200).map((r, i) => (<tr key={i}><td>{i + 1}</td><td><span className={`tag ${r.status === "ok" ? "tag-calc" : r.status === "duplicate" ? "tag-assume" : "tag-unver"}`}>{r.status}</span></td><td>{r.v?.date ?? "—"}</td><td>{r.v?.customer ?? "—"}</td><td className="r num">{r.v?.amount ?? "—"}</td><td>{r.v?.product ?? ""}</td><td className="text-muted">{r.reason}</td></tr>))}
            </tbody></table></div>
            {rows.length > 200 && <p className="mt-2 text-xs text-muted">Showing the first 200 of {rows.length} rows. All rows are processed on import.</p>}
          </Panel>
        </>
      )}
    </div>
  );
}
