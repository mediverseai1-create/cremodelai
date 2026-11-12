import { describe, expect, it } from "vitest";
import { cleanRows, computeMetrics, followUpStatus, type SaleRow } from "./analytics";

const row = (date: string, customer: string, amount: number, extra: Partial<SaleRow> = {}): SaleRow => ({ date, customer, amount, ...extra });

const data: SaleRow[] = [
  row("2026-04-05", "Acme", 1000, { product: "A", region: "N", rep: "Ann" }),
  row("2026-04-10", "Beta", 500, { product: "B", region: "S", rep: "Bo" }),
  row("2026-04-20", "Cora", 500, { product: "A", region: "N", rep: "Ann" }),
  row("2026-05-05", "Acme", 400, { product: "A", region: "N", rep: "Ann" }),
  row("2026-05-12", "Beta", 900, { product: "B", region: "S", rep: "Bo" }),
  row("2026-05-25", "Dune", 700, { product: "B", region: "S", rep: "Bo" }),
];

describe("revenue analytics", () => {
  const m = computeMetrics(data, "monthly", "2026-05-31");
  it("totals current and previous periods", () => {
    expect(m.revenue).toBe(2000);
    expect(m.prevRevenue).toBe(2000);
  });
  it("flags declining customers and revenue at risk", () => {
    const acme = m.decliningCustomers.find((c) => c.name === "Acme");
    expect(acme).toBeTruthy();
    expect(m.revenueAtRisk).toBeGreaterThanOrEqual(600);
  });
  it("finds growing segments as opportunities", () => {
    expect(m.opportunities.some((o) => o.name === "Beta")).toBe(true);
  });
  it("calculates shares that sum to ~100", () => {
    const total = m.segments.customer.reduce((a, s) => a + s.share, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });
  it("rejects invalid rows visibly instead of dropping them", () => {
    const c = cleanRows([row("bad", "X", 1), row("2026-01-01", "", 5), row("2026-01-01", "Y", NaN), row("2026-01-01", "Z", 5)]);
    expect(c.rows).toHaveLength(1);
    expect(c.rejected).toHaveLength(3);
    expect(computeMetrics([row("bad", "X", 1)]).warnings.length).toBeGreaterThan(0);
  });
  it("reports insufficient data for trend with few months", () => {
    expect(m.trend.direction).toBe("insufficient-data");
  });
  it("detects a rising trend with enough months", () => {
    const series = ["01", "02", "03", "04", "05", "06"].map((mo, i) => row(`2026-${mo}-15`, "Acme", 1000 + i * 300));
    const t = computeMetrics(series, "monthly").trend;
    expect(t.direction).toBe("up");
  });
  it("handles empty data", () => {
    const e = computeMetrics([], "weekly", "2026-01-01");
    expect(e.revenue).toBe(0);
    expect(e.changePct).toBeNull();
  });
  it("triages follow-ups", () => {
    const d = { id: "1", name: "d", stage: "converse", follow_up_on: "2026-09-01", last_contact: null, value: 1 };
    expect(followUpStatus(d, "2026-09-05")).toBe("overdue");
    expect(followUpStatus({ ...d, follow_up_on: "2026-09-05" }, "2026-09-05")).toBe("due-today");
    expect(followUpStatus({ ...d, follow_up_on: null, last_contact: "2026-08-01" }, "2026-09-05")).toBe("stale");
    expect(followUpStatus({ ...d, stage: "won" }, "2026-09-05")).toBe("none");
  });
});
