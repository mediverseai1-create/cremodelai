import type { ModelInputs, ModelResult } from "./types";
import { computeModel } from "./calc";

export interface ScenarioAdjustments {
  priceChangePct: number;
  volumeChangePct: number;
  growthDeltaPts: number; // added to each product's monthly growth
  variableCostChangePct: number; // unit costs and %-of-revenue variable costs
  fixedCostChangePct: number;
  hiringDelayMonths: number;
  extraMarketingMonthly: number;
  capexChangePct: number;
  fundingChangePct: number;
  receivablesDays?: number;
}

export const NEUTRAL: ScenarioAdjustments = {
  priceChangePct: 0, volumeChangePct: 0, growthDeltaPts: 0, variableCostChangePct: 0, fixedCostChangePct: 0,
  hiringDelayMonths: 0, extraMarketingMonthly: 0, capexChangePct: 0, fundingChangePct: 0,
};

/** Default presets: editable starting points, not forecasts. */
export const DEFAULT_SCENARIOS: { key: string; name: string; adj: ScenarioAdjustments }[] = [
  { key: "best", name: "Best case", adj: { ...NEUTRAL, priceChangePct: 5, volumeChangePct: 20, growthDeltaPts: 1 } },
  { key: "expected", name: "Expected case", adj: { ...NEUTRAL } },
  { key: "downside", name: "Downside case", adj: { ...NEUTRAL, volumeChangePct: -20, growthDeltaPts: -1, variableCostChangePct: 10 } },
];

export function applyScenario(base: ModelInputs, a: ScenarioAdjustments): ModelInputs {
  const f = (p: number) => 1 + p / 100;
  return {
    ...base,
    receivablesDays: a.receivablesDays ?? base.receivablesDays,
    products: base.products.map((p) => ({
      ...p,
      price: p.price * f(a.priceChangePct),
      startVolume: p.startVolume * f(a.volumeChangePct),
      newCustomersPerMonth: p.newCustomersPerMonth === undefined ? undefined : p.newCustomersPerMonth * f(a.volumeChangePct),
      monthlyGrowthPct: p.monthlyGrowthPct + a.growthDeltaPts,
      unitCost: p.unitCost * f(a.variableCostChangePct),
    })),
    variableCosts: base.variableCosts.map((c) => ({ ...c, pctOfRevenue: Math.min(100, c.pctOfRevenue * f(a.variableCostChangePct)) })),
    fixedCosts: [
      ...base.fixedCosts.map((c) => ({ ...c, monthly: c.monthly * f(a.fixedCostChangePct) })),
      ...(a.extraMarketingMonthly > 0
        ? [{ id: "scenario-marketing", name: "Scenario marketing spend", category: "marketing" as const, monthly: a.extraMarketingMonthly, annualGrowthPct: 0 }]
        : []),
    ],
    staff: base.staff.map((s) => ({ ...s, startMonth: s.startMonth + (s.startMonth > 1 ? a.hiringDelayMonths : 0) })),
    investments: base.investments.map((i) => ({ ...i, amount: i.amount * f(a.capexChangePct) })),
    funding: base.funding.map((x) => ({ ...x, amount: x.amount * f(a.fundingChangePct) })),
  };
}

export function runScenario(base: ModelInputs, a: ScenarioAdjustments): ModelResult {
  return computeModel(applyScenario(base, a));
}

export interface ScenarioDelta {
  metric: string;
  base: number | null;
  scenario: number | null;
  delta: number | null;
}

export function compareResults(base: ModelResult, sc: ModelResult): ScenarioDelta[] {
  const rows: [string, number | null, number | null][] = [
    ["Revenue", base.totals.revenue, sc.totals.revenue],
    ["Gross profit", base.totals.grossProfit, sc.totals.grossProfit],
    ["Operating profit", base.totals.operatingProfit, sc.totals.operatingProfit],
    ["Net profit", base.totals.netProfit, sc.totals.netProfit],
    ["Net cash movement", base.totals.netCash, sc.totals.netCash],
    ["Break-even revenue / month", base.breakEven.breakEvenRevenue, sc.breakEven.breakEvenRevenue],
    ["Funding gap", base.funding.fundingGap, sc.funding.fundingGap],
    ["Minimum closing cash", base.funding.minClosingCash, sc.funding.minClosingCash],
    ["First profitable month", base.breakEven.firstProfitableMonth, sc.breakEven.firstProfitableMonth],
  ];
  return rows.map(([metric, b, s]) => ({ metric, base: b, scenario: s, delta: b !== null && s !== null ? Math.round((s - b) * 100) / 100 : null }));
}
