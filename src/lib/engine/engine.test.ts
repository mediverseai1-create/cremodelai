import { describe, expect, it } from "vitest";
import { computeModel, validateInputs } from "./calc";
import { applyScenario, NEUTRAL, runScenario } from "./scenarios";
import type { ModelInputs } from "./types";

const base: ModelInputs = {
  currency: "USD", horizonMonths: 12, openingCash: 1000, receivablesDays: 0, taxRatePct: 0,
  products: [{ id: "a", name: "A", kind: "product", price: 100, unitCost: 40, startVolume: 100, monthlyGrowthPct: 0, discountPct: 0 }],
  fixedCosts: [{ id: "f", name: "Rent", category: "rent", monthly: 2000, annualGrowthPct: 0 }],
  variableCosts: [{ id: "v", name: "Fees", pctOfRevenue: 10 }],
  staff: [{ id: "s", role: "Ops", department: "Ops", headcount: 1, monthlySalary: 1000, benefitsPct: 0, startMonth: 1 }],
  investments: [{ id: "i", name: "Setup", amount: 5000, month: 1 }],
  funding: [{ id: "g", name: "Founder", type: "founder", amount: 10000, month: 1 }],
};

describe("engine", () => {
  const r = computeModel(base);
  it("computes monthly P&L", () => {
    const m = r.months[0];
    expect(m.revenue).toBe(10000);
    expect(m.directCosts).toBe(4000);
    expect(m.grossProfit).toBe(6000);
    expect(m.variableCosts).toBe(1000);
    expect(m.contribution).toBe(5000);
    expect(m.operatingProfit).toBe(2000);
  });
  it("cash flow reconciles", () => {
    expect(r.months[0].closingCash).toBe(1000 + 10000 - 8000 - 5000 + 10000);
    const sumNet = r.months.reduce((a, x) => a + x.netCash, 0);
    expect(r.months[11].closingCash).toBeCloseTo(1000 + sumNet, 2);
  });
  it("break-even matches formula", () => {
    expect(r.breakEven.weightedUnitContribution).toBe(50);
    expect(r.breakEven.breakEvenUnits).toBe(60);
    expect(r.breakEven.breakEvenRevenue).toBe(6000);
    expect(r.breakEven.marginOfSafetyPct).toBe(40);
  });
  it("receivables delay shifts cash but not profit", () => {
    const d = computeModel({ ...base, receivablesDays: 30 });
    expect(d.months[0].cashReceipts).toBe(0);
    expect(d.months[1].cashReceipts).toBe(10000);
    expect(d.totals.revenue).toBe(r.totals.revenue);
    expect(d.funding.workingCapitalTied).toBe(10000);
  });
  it("detects a funding gap and runway", () => {
    const g = computeModel({ ...base, funding: [], investments: [{ id: "i", name: "Big", amount: 100000, month: 1 }] });
    expect(g.funding.fundingGap).toBeGreaterThan(0);
    expect(g.funding.runwayMonths).toBe(1);
  });
  it("compounds growth and respects hire start month", () => {
    const g = computeModel({ ...base, products: [{ ...base.products[0], monthlyGrowthPct: 10 }], staff: [{ ...base.staff[0], startMonth: 3 }] });
    expect(g.months[1].revenue).toBe(11000);
    expect(g.months[0].staffCosts).toBe(0);
    expect(g.months[2].staffCosts).toBe(1000);
  });
  it("rolls up quarters and years", () => {
    expect(r.quarters).toHaveLength(4);
    expect(r.years).toHaveLength(1);
    expect(r.years[0].revenue).toBe(r.totals.revenue);
  });
  it("is decimal-safe", () => {
    const x = computeModel({ ...base, products: [{ ...base.products[0], price: 0.1, startVolume: 3, unitCost: 0 }] });
    expect(x.months[0].revenue).toBe(0.3);
  });
  it("reports invalid input instead of treating it as zero", () => {
    const bad = { ...base, products: [{ ...base.products[0], price: undefined }] };
    expect(validateInputs(bad).ok).toBe(false);
    expect(computeModel({ currency: "USD" }).issues.length).toBeGreaterThan(0);
  });
  it("warns on negative unit margins", () => {
    const v = validateInputs({ ...base, products: [{ ...base.products[0], unitCost: 200 }] });
    expect(v.issues.some((i) => i.message.includes("below its direct unit cost"))).toBe(true);
  });
});

describe("scenarios", () => {
  it("neutral adjustments reproduce the base", () => {
    expect(runScenario(base, NEUTRAL).totals).toEqual(computeModel(base).totals);
  });
  it("price up raises revenue and lowers break-even units", () => {
    const s = runScenario(base, { ...NEUTRAL, priceChangePct: 10 });
    expect(s.months[0].revenue).toBe(11000);
    expect(s.breakEven.breakEvenUnits!).toBeLessThan(60);
  });
  it("volume down 20% lowers revenue 20%", () => {
    expect(runScenario(base, { ...NEUTRAL, volumeChangePct: -20 }).months[0].revenue).toBe(8000);
  });
  it("hiring delay does not move month-1 hires", () => {
    expect(applyScenario(base, { ...NEUTRAL, hiringDelayMonths: 3 }).staff[0].startMonth).toBe(1);
  });
});
