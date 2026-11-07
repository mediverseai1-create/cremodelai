export function money(n: number | null | undefined, currency = "USD", compact = false): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: compact ? 1 : 0, notation: compact ? "compact" : "standard" }).format(n);
  } catch {
    return `${currency} ${n.toFixed(0)}`;
  }
}
export const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toFixed(1)}%`);
export const num = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: d }));
export const uid = () => Math.random().toString(36).slice(2, 10);

export function toCsv(rows: Record<string, string | number | null>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.map(esc).join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
export function download(name: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
