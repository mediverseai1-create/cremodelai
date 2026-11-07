"use client";
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { uid } from "@/lib/format";

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "good" | "bad" | "warn" }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className={`num mt-1 font-display text-2xl font-extrabold ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Panel({ title, note, actions, children }: { title: string; note?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card fade-in p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          {note && <p className="mt-1 max-w-3xl text-sm text-muted">{note}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export type EvidenceKind = "calculation" | "assumption" | "interpretation" | "unverified";
export function Evidence({ kind }: { kind: EvidenceKind }) {
  const map = { calculation: ["tag-calc", "Calculated"], assumption: ["tag-assume", "Your assumption"], interpretation: ["tag-ai", "AI interpretation"], unverified: ["tag-unver", "Unverified"] } as const;
  return <span className={`tag ${map[kind][0]}`}>{map[kind][1]}</span>;
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card border-dashed p-10 text-center">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface Col<T> { key: keyof T & string; label: string; type: "text" | "number" | "select"; options?: string[]; width?: string; step?: number }

export function EditableTable<T extends { id: string }>({
  rows, cols, onChange, makeRow, addLabel, disabled,
}: { rows: T[]; cols: Col<T>[]; onChange: (rows: T[]) => void; makeRow: () => Omit<T, "id">; addLabel: string; disabled?: boolean }) {
  const set = (id: string, key: string, raw: string, type: string) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [key]: type === "number" ? (raw === "" ? NaN : Number(raw)) : raw } : r)));
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}<th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {cols.map((c) => {
                  const v = r[c.key] as unknown;
                  const invalid = c.type === "number" && typeof v === "number" && Number.isNaN(v);
                  return (
                    <td key={c.key} style={{ minWidth: c.width ?? "7rem" }}>
                      {c.type === "select" ? (
                        <select className="input" disabled={disabled} value={String(v)} onChange={(e) => set(r.id, c.key, e.target.value, "select")}>
                          {c.options!.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          className={`input ${invalid ? "border-bad" : ""}`} disabled={disabled} aria-label={c.label}
                          type={c.type === "number" ? "number" : "text"} step={c.step ?? "any"}
                          value={invalid ? "" : String(v ?? "")} placeholder={invalid ? "required" : ""}
                          onChange={(e) => set(r.id, c.key, e.target.value, c.type)}
                        />
                      )}
                    </td>
                  );
                })}
                <td>
                  <button className="btn btn-ghost !px-2 !py-1" disabled={disabled} aria-label="Remove row" onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={cols.length + 1} className="py-6 text-center text-muted">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost mt-3" disabled={disabled} onClick={() => onChange([...rows, { id: uid(), ...makeRow() } as T])}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
