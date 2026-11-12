export interface SaleRow {
  date: string; // YYYY-MM-DD
  customer: string;
  amount: number;
  product?: string | null;
  region?: string | null;
  rep?: string | null;
}

export const CADENCES = ["daily", "weekly", "biweekly", "monthly", "quarterly", "biannual", "annual"] as const;
export type Cadence = (typeof CADENCES)[number];
export const CADENCE_DAYS: Record<Cadence, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 90, biannual: 182, annual: 365 };

export type Dimension = "customer" | "product" | "region" | "rep";

export interface Segment { name: string; revenue: number; share: number; prevRevenue: number; change: number; changePct: number | null }

export interface RevenueMetrics {
  cadence: Cadence;
  periodStart: string;
  periodEnd: string;
  prevStart: string;
  prevEnd: string;
  records: number;
  revenue: number;
  prevRevenue: number;
  change: number;
  changePct: number | null;
  customers: number;
  avgSale: number;
  monthly: { month: string; revenue: number }[];
  trend: { direction: "up" | "down" | "flat" | "insufficient-data"; monthlyChangePct: number | null; isSignificant: boolean };
  segments: Record<Dimension, Segment[]>;
  decliningCustomers: Segment[]; // dropped >= 20% vs previous period (including lapsed)
  revenueAtRisk: number; // revenue lost from declining customers vs previous period
  revenueAtRiskPct: number | null; // of previous-period revenue
  topCustomerShare: number | null; // concentration, % of period revenue
  opportunities: { dimension: Dimension; name: string; revenue: number; changePct: number | null; why: string }[];
  underperformers: { dimension: Dimension; name: string; revenue: number; changePct: number | null; why: string }[];
  unusual: { month: string; revenue: number; note: string }[];
  warnings: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const DAY = 86400000;
const toMs = (d: string) => Date.parse(d + "T00:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Validates and normalises rows. Invalid rows are returned separately, never silently dropped. */
export function cleanRows(raw: SaleRow[]): { rows: SaleRow[]; rejected: { index: number; reason: string }[] } {
  const rows: SaleRow[] = [];
  const rejected: { index: number; reason: string }[] = [];
  raw.forEach((r, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(toMs(r.date))) return void rejected.push({ index, reason: "invalid date" });
    if (!r.customer?.trim()) return void rejected.push({ index, reason: "missing customer" });
    if (typeof r.amount !== "number" || !Number.isFinite(r.amount)) return void rejected.push({ index, reason: "invalid amount" });
    rows.push({ ...r, customer: r.customer.trim(), product: r.product?.trim() || null, region: r.region?.trim() || null, rep: r.rep?.trim() || null });
  });
  return { rows, rejected };
}

function sumBy(rows: SaleRow[], dim: Dimension): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const key = r[dim]?.toString().trim();
    if (!key) continue;
    m.set(key, (m.get(key) ?? 0) + r.amount);
  }
  return m;
}

function segments(cur: SaleRow[], prev: SaleRow[], dim: Dimension, total: number): Segment[] {
  const a = sumBy(cur, dim), b = sumBy(prev, dim);
  const names = new Set([...a.keys(), ...b.keys()]);
  return [...names].map((name) => {
    const revenue = a.get(name) ?? 0, prevRevenue = b.get(name) ?? 0;
    return { name, revenue: r2(revenue), share: total > 0 ? r2((revenue / total) * 100) : 0, prevRevenue: r2(prevRevenue), change: r2(revenue - prevRevenue), changePct: prevRevenue > 0 ? r2(((revenue - prevRevenue) / prevRevenue) * 100) : null };
  }).sort((x, y) => y.revenue - x.revenue || y.prevRevenue - x.prevRevenue);
}

function slope(ys: number[]): number {
  const n = ys.length;
  const xm = (n - 1) / 2, ym = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  ys.forEach((y, x) => { num += (x - xm) * (y - ym); den += (x - xm) ** 2; });
  return den === 0 ? 0 : num / den;
}

export function computeMetrics(input: SaleRow[], cadence: Cadence = "monthly", asOf?: string): RevenueMetrics {
  const { rows, rejected } = cleanRows(input);
  const warnings: string[] = [];
  if (rejected.length) warnings.push(`${rejected.length} row(s) were excluded because of invalid data.`);
  if (rows.length === 0) warnings.push("No valid sales rows yet.");
  const maxMs = asOf ? toMs(asOf) : rows.length ? Math.max(...rows.map((r) => toMs(r.date))) : Date.now();
  const days = CADENCE_DAYS[cadence];
  const endMs = maxMs, startMs = endMs - (days - 1) * DAY;
  const pEnd = startMs - DAY, pStart = pEnd - (days - 1) * DAY;
  const inWin = (r: SaleRow, a: number, b: number) => { const t = toMs(r.date); return t >= a && t <= b; };
  const cur = rows.filter((r) => inWin(r, startMs, endMs));
  const prev = rows.filter((r) => inWin(r, pStart, pEnd));
  const revenue = cur.reduce((a, r) => a + r.amount, 0);
  const prevRevenue = prev.reduce((a, r) => a + r.amount, 0);
  if (rows.length && prev.length === 0) warnings.push("No data in the previous period, so changes cannot be calculated yet.");

  // monthly series
  const byMonth = new Map<string, number>();
  for (const r of rows) byMonth.set(r.date.slice(0, 7), (byMonth.get(r.date.slice(0, 7)) ?? 0) + r.amount);
  const monthly = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, revenue: r2(v) }));

  // trend: slope of the last up-to-6 months relative to their mean; "significant" if it exceeds typical month-to-month noise
  let trend: RevenueMetrics["trend"] = { direction: "insufficient-data", monthlyChangePct: null, isSignificant: false };
  if (monthly.length >= 4) {
    const last = monthly.slice(-6).map((m) => m.revenue);
    const mean = last.reduce((a, b) => a + b, 0) / last.length;
    const s = slope(last);
    const pctPerMonth = mean > 0 ? (s / mean) * 100 : 0;
    const diffs = last.slice(1).map((v, i) => v - last[i]);
    const dm = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const sd = Math.sqrt(diffs.reduce((a, b) => a + (b - dm) ** 2, 0) / diffs.length);
    const significant = Math.abs(s) > sd / Math.sqrt(last.length);
    trend = { direction: Math.abs(pctPerMonth) < 1 ? "flat" : pctPerMonth > 0 ? "up" : "down", monthlyChangePct: r2(pctPerMonth), isSignificant: significant };
  }

  const dims: Dimension[] = ["customer", "product", "region", "rep"];
  const segs = Object.fromEntries(dims.map((d) => [d, segments(cur, prev, d, revenue)])) as Record<Dimension, Segment[]>;

  const declining = segs.customer.filter((s) => s.prevRevenue > 0 && s.revenue < s.prevRevenue * 0.8);
  const atRisk = declining.reduce((a, s) => a + (s.prevRevenue - s.revenue), 0);
  const opportunities: RevenueMetrics["opportunities"] = [];
  const underperformers: RevenueMetrics["underperformers"] = [];
  for (const d of dims) {
    for (const s of segs[d]) {
      if (s.changePct !== null && s.changePct >= 20 && s.revenue > 0) opportunities.push({ dimension: d, name: s.name, revenue: s.revenue, changePct: s.changePct, why: `Up ${s.changePct}% vs the previous period and ${s.share}% of revenue.` });
      if (s.prevRevenue > 0 && s.changePct !== null && s.changePct <= -15) underperformers.push({ dimension: d, name: s.name, revenue: s.revenue, changePct: s.changePct, why: `Down ${Math.abs(s.changePct)}% vs the previous period.` });
    }
  }
  opportunities.sort((a, b) => b.revenue - a.revenue);
  underperformers.sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0));

  // unusual months: more than 2 standard deviations from the mean (needs >= 6 months)
  const unusual: RevenueMetrics["unusual"] = [];
  if (monthly.length >= 6) {
    const vals = monthly.map((m) => m.revenue);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    if (sd > 0) for (const m of monthly) { const z = (m.revenue - mean) / sd; if (Math.abs(z) > 2) unusual.push({ month: m.month, revenue: m.revenue, note: z > 0 ? "Unusually high month" : "Unusually low month" }); }
  }

  return {
    cadence, periodStart: iso(startMs), periodEnd: iso(endMs), prevStart: iso(pStart), prevEnd: iso(pEnd),
    records: cur.length, revenue: r2(revenue), prevRevenue: r2(prevRevenue), change: r2(revenue - prevRevenue),
    changePct: prevRevenue > 0 ? r2(((revenue - prevRevenue) / prevRevenue) * 100) : null,
    customers: new Set(cur.map((r) => r.customer)).size, avgSale: cur.length ? r2(revenue / cur.length) : 0,
    monthly, trend, segments: segs, decliningCustomers: declining, revenueAtRisk: r2(atRisk),
    revenueAtRiskPct: prevRevenue > 0 ? r2((atRisk / prevRevenue) * 100) : null,
    topCustomerShare: segs.customer.length && revenue > 0 ? segs.customer[0].share : null,
    opportunities: opportunities.slice(0, 8), underperformers: underperformers.slice(0, 8), unusual, warnings,
  };
}

/** Deterministic follow-up triage for pipeline deals. */
export interface DealLike { id: string; name: string; stage: string; follow_up_on: string | null; last_contact: string | null; value: number | null }
export function followUpStatus(d: DealLike, today: string): "overdue" | "due-today" | "stale" | "scheduled" | "none" {
  if (d.stage === "won" || d.stage === "lost") return "none";
  if (d.follow_up_on) {
    if (d.follow_up_on < today) return "overdue";
    if (d.follow_up_on === today) return "due-today";
  }
  if (d.last_contact && (toMs(today) - toMs(d.last_contact)) / DAY > 14 && !d.follow_up_on) return "stale";
  return d.follow_up_on ? "scheduled" : "none";
}
