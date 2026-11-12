import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaleRow } from "./analytics";

const PAGE = 1000;
const MAX_ROWS = 50000;

/** Loads an organization's sales rows (RLS-scoped through the supplied client). */
export async function loadSales(sb: SupabaseClient, orgId: string): Promise<{ rows: SaleRow[]; truncated: boolean }> {
  const rows: SaleRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await sb.from("sales_records").select("sold_at,customer,product,region,rep,amount").eq("org_id", orgId).order("sold_at").range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) rows.push({ date: r.sold_at, customer: r.customer, product: r.product, region: r.region, rep: r.rep, amount: Number(r.amount) });
    if (!data || data.length < PAGE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

/** Ideal-customer profile derived deterministically from existing sales. */
export function deriveIcp(rows: SaleRow[]) {
  const totals = new Map<string, { revenue: number; products: Map<string, number>; regions: Map<string, number> }>();
  for (const r of rows) {
    const c = totals.get(r.customer) ?? { revenue: 0, products: new Map(), regions: new Map() };
    c.revenue += r.amount;
    if (r.product) c.products.set(r.product, (c.products.get(r.product) ?? 0) + r.amount);
    if (r.region) c.regions.set(r.region, (c.regions.get(r.region) ?? 0) + r.amount);
    totals.set(r.customer, c);
  }
  const top = [...totals.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, Math.max(3, Math.ceil(totals.size * 0.2)));
  const tally = (pick: (c: (typeof top)[number][1]) => Map<string, number>) => {
    const m = new Map<string, number>();
    for (const [, c] of top) for (const [k, v] of pick(c)) m.set(k, (m.get(k) ?? 0) + v);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  };
  return {
    customersAnalysed: totals.size,
    topCustomers: top.slice(0, 10).map(([name, c]) => ({ name, revenue: Math.round(c.revenue) })),
    topProducts: tally((c) => c.products),
    topRegions: tally((c) => c.regions),
  };
}
