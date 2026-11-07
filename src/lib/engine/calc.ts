import Decimal from "decimal.js";
import type { ModelInputs, ModelResult, MonthRow, PeriodSummary, ProductResult, ValidationIssue } from "./types";
import { modelInputsSchema } from "./types";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });
const D = (n: number | Decimal) => new Decimal(n);
const r2 = (d: Decimal) => d.toDecimalPlaces(2).toNumber();
const pctOf = (num: Decimal, den: Decimal) => (den.isZero() ? null : r2(num.div(den).times(100)));

/** Validate inputs. Missing/invalid data is reported, never silently treated as zero. */
export function validateInputs(raw: unknown): { ok: boolean; issues: ValidationIssue[]; data?: ModelInputs } {
  const parsed = modelInputsSchema.safeParse(raw);
  const issues: ValidationIssue[] = [];
  if (!parsed.success) {
    for (const i of parsed.error.issues) issues.push({ severity: "error", field: i.path.join(".") || "model", message: i.message });
    return { ok: false, issues };
  }
  const m = parsed.data;
  if (m.products.length === 0) issues.push({ severity: "warning", field: "products", message: "No products or services defined; revenue cannot be projected." });
  for (const p of m.products) {
    if (p.price === 0) issues.push({ severity: "warning", field: `products.${p.name}`, message: `${p.name} has a price of 0.` });
    if (p.unitCost > p.price * (1 - p.discountPct / 100)) issues.push({ severity: "warning", field: `products.${p.name}`, message: `${p.name} sells below its direct unit cost (negative margin per unit).` });
    if (p.monthlyGrowthPct > 20) issues.push({ severity: "warning", field: `products.${p.name}`, message: `${p.name} assumes ${p.monthlyGrowthPct}% monthly volume growth, which compounds very quickly. Validate this assumption.` });
  }
  if (m.fixedCosts.length === 0 && m.staff.length === 0) issues.push({ severity: "warning", field: "costs", message: "No fixed costs or staff entered. Break-even and profit will be overstated." });
  for (const s of m.staff) if (s.startMonth > m.horizonMonths) issues.push({ severity: "warning", field: `staff.${s.role}`, message: `${s.role} starts after the planning horizon and has no effect.` });
  for (const f of m.funding) if (f.month > m.horizonMonths) issues.push({ severity: "warning", field: `funding.${f.name}`, message: `${f.name} arrives after the planning horizon.` });
  return { ok: true, issues, data: m };
}

export function computeModel(raw: unknown): ModelResult {
  const v = validateInputs(raw);
  if (!v.ok || !v.data) {
    const cur = typeof raw === "object" && raw && "currency" in raw ? String((raw as { currency: unknown }).currency) : "USD";
    return emptyResult(cur, v.issues);
  }
  const m = v.data;
  const H = m.horizonMonths;
  const lag = Math.round(m.receivablesDays / 30);
  const hundred = D(100);

  // ---- per-product volumes ----
  const volume: Decimal[][] = [];
  for (const p of m.products) {
    const row: Decimal[] = [];
    if (p.kind === "subscription" && p.newCustomersPerMonth !== undefined) {
      let active = D(p.startVolume);
      const churn = D(p.churnPct ?? 0).div(hundred);
      for (let t = 1; t <= H; t++) {
        if (t > 1) active = active.times(D(1).minus(churn)).plus(p.newCustomersPerMonth);
        row.push(active);
      }
    } else {
      const g = D(1).plus(D(p.monthlyGrowthPct).div(hundred));
      for (let t = 1; t <= H; t++) row.push(D(p.startVolume).times(g.pow(t - 1)));
    }
    volume.push(row);
  }

  const months: MonthRow[] = [];
  const revByMonth: Decimal[] = [];
  const prodAgg = m.products.map(() => ({ rev: D(0), direct: D(0), varc: D(0) }));
  const varPct = m.variableCosts.reduce((a, c) => a.plus(c.pctOfRevenue), D(0)).div(hundred);

  let cash = D(m.openingCash);
  let cumNoFin = D(0);
  let troughNoFinancing = D(0);
  let troughMonth: number | null = null;
  const monthlyFixedAll: Decimal[] = [];
  const monthlyStaffAll: Decimal[] = [];

  for (let t = 1; t <= H; t++) {
    let rev = D(0), direct = D(0);
    m.products.forEach((p, i) => {
      const net = D(p.price).times(D(1).minus(D(p.discountPct).div(hundred)));
      const q = volume[i][t - 1];
      const pr = net.times(q);
      const pd = D(p.unitCost).times(q);
      rev = rev.plus(pr);
      direct = direct.plus(pd);
      prodAgg[i].rev = prodAgg[i].rev.plus(pr);
      prodAgg[i].direct = prodAgg[i].direct.plus(pd);
      prodAgg[i].varc = prodAgg[i].varc.plus(pr.times(varPct));
    });
    revByMonth.push(rev);
    const varc = rev.times(varPct);
    const fixed = m.fixedCosts.reduce(
      (a, c) => a.plus(D(c.monthly).times(D(1).plus(D(c.annualGrowthPct).div(hundred)).pow(Math.floor((t - 1) / 12)))),
      D(0),
    );
    const staff = m.staff.reduce(
      (a, s) => (t >= s.startMonth ? a.plus(D(s.monthlySalary).times(s.headcount).times(D(1).plus(D(s.benefitsPct).div(hundred)))) : a),
      D(0),
    );
    monthlyFixedAll.push(fixed);
    monthlyStaffAll.push(staff);

    const gross = rev.minus(direct);
    const contribution = gross.minus(varc);
    const opProfit = contribution.minus(fixed).minus(staff);
    const tax = opProfit.gt(0) ? opProfit.times(D(m.taxRatePct).div(hundred)) : D(0);
    const net = opProfit.minus(tax);

    const receipts = t - lag >= 1 ? revByMonth[t - lag - 1] : D(0);
    const opOut = direct.plus(varc).plus(fixed).plus(staff).plus(tax);
    const inv = m.investments.filter((x) => x.month === t).reduce((a, x) => a.plus(x.amount), D(0));
    const fin = m.funding.filter((x) => x.month === t).reduce((a, x) => a.plus(x.amount), D(0));
    const netCash = receipts.minus(opOut).minus(inv).plus(fin);
    cash = cash.plus(netCash);
    cumNoFin = cumNoFin.plus(receipts.minus(opOut).minus(inv));
    if (cumNoFin.lt(troughNoFinancing)) {
      troughNoFinancing = cumNoFin;
      troughMonth = t;
    }

    months.push({
      month: t, revenue: r2(rev), directCosts: r2(direct), grossProfit: r2(gross), variableCosts: r2(varc),
      contribution: r2(contribution), fixedCosts: r2(fixed), staffCosts: r2(staff), operatingProfit: r2(opProfit),
      tax: r2(tax), netProfit: r2(net), cashReceipts: r2(receipts), cashOperatingOut: r2(opOut),
      investmentOut: r2(inv), financingIn: r2(fin), netCash: r2(netCash), closingCash: r2(cash),
    });
  }

  const sum = (k: keyof MonthRow) => months.reduce((a, r) => a.plus(r[k]), D(0));
  const totals = {
    revenue: r2(sum("revenue")), grossProfit: r2(sum("grossProfit")), operatingProfit: r2(sum("operatingProfit")),
    netProfit: r2(sum("netProfit")), netCash: r2(sum("netCash")),
  };

  // ---- product profitability ----
  const rr = Math.min(12, H);
  const rrFixedTotal = monthlyFixedAll[rr - 1].plus(monthlyStaffAll[rr - 1]);
  const products: ProductResult[] = m.products.map((p, i) => {
    const a = prodAgg[i];
    const contribution = a.rev.minus(a.direct).minus(a.varc);
    const net = D(p.price).times(D(1).minus(D(p.discountPct).div(hundred)));
    const unitContribution = net.times(D(1).minus(varPct)).minus(p.unitCost);
    return {
      id: p.id, name: p.name, revenue: r2(a.rev), directCosts: r2(a.direct), variableCosts: r2(a.varc),
      contribution: r2(contribution), contributionMarginPct: pctOf(contribution, a.rev),
      grossMarginPct: pctOf(a.rev.minus(a.direct), a.rev), unitContribution: r2(unitContribution),
      breakEvenUnitsMonthly: unitContribution.gt(0) ? r2(rrFixedTotal.div(unitContribution)) : null,
    };
  });

  // ---- break-even at run-rate month ----
  let wContribution = D(0), totalUnits = D(0), rrRevenue = D(0);
  m.products.forEach((p, i) => {
    const q = volume[i][rr - 1];
    const net = D(p.price).times(D(1).minus(D(p.discountPct).div(hundred)));
    wContribution = wContribution.plus(net.times(D(1).minus(varPct)).minus(p.unitCost).times(q));
    totalUnits = totalUnits.plus(q);
    rrRevenue = rrRevenue.plus(net.times(q));
  });
  const avgUnitContribution = totalUnits.gt(0) ? wContribution.div(totalUnits) : null;
  const cmRatio = rrRevenue.gt(0) ? wContribution.div(rrRevenue) : null;
  const beRevenue = cmRatio && cmRatio.gt(0) ? rrFixedTotal.div(cmRatio) : null;
  const beUnits = avgUnitContribution && avgUnitContribution.gt(0) ? rrFixedTotal.div(avgUnitContribution) : null;
  const firstProfitable = months.find((r) => r.operatingProfit >= 0 && r.revenue > 0)?.month ?? null;
  let payback: number | null = null;
  if (troughMonth !== null) {
    let c = D(0);
    for (const r of months) {
      c = c.plus(r.cashReceipts - r.cashOperatingOut - r.investmentOut);
      if (r.month > troughMonth && c.gte(0)) { payback = r.month; break; }
    }
  }

  // ---- funding ----
  const minClosing = months.reduce((a, r) => Decimal.min(a, r.closingCash), D(m.openingCash));
  const negMonth = months.find((r) => r.closingCash < 0)?.month ?? null;
  const startup = m.investments.reduce((a, x) => a.plus(x.amount), D(0));
  const totalFunding = m.funding.reduce((a, x) => a.plus(x.amount), D(0));
  const outstandingAR = lag > 0 ? revByMonth.slice(Math.max(0, H - lag)).reduce((a, x) => a.plus(x), D(0)) : D(0);

  return {
    currency: m.currency, months, quarters: summarize(months, 3, "Q"), years: summarize(months, 12, "Year "),
    totals,
    grossMarginPct: pctOf(D(totals.grossProfit), D(totals.revenue)),
    operatingMarginPct: pctOf(D(totals.operatingProfit), D(totals.revenue)),
    products,
    breakEven: {
      runRateMonth: rr, monthlyFixedCosts: r2(rrFixedTotal),
      weightedUnitContribution: avgUnitContribution ? r2(avgUnitContribution) : null,
      contributionMarginPct: cmRatio ? r2(cmRatio.times(100)) : null,
      breakEvenRevenue: beRevenue ? r2(beRevenue) : null,
      breakEvenUnits: beUnits ? r2(beUnits) : null,
      marginOfSafetyPct: beRevenue && rrRevenue.gt(0) ? r2(rrRevenue.minus(beRevenue).div(rrRevenue).times(100)) : null,
      firstProfitableMonth: firstProfitable, paybackMonth: payback,
      formula: `Break-even revenue = monthly fixed costs (fixed + staff) ÷ contribution margin ratio. Break-even units = fixed costs ÷ weighted contribution per unit. Evaluated at month ${rr}.`,
    },
    funding: {
      startupCosts: r2(startup),
      peakFundingNeed: r2(Decimal.max(D(0), troughNoFinancing.neg().minus(m.openingCash))),
      peakMonth: troughMonth,
      totalFundingPlanned: r2(totalFunding),
      fundingGap: r2(Decimal.max(D(0), minClosing.neg())),
      minClosingCash: r2(minClosing),
      runwayMonths: negMonth,
      workingCapitalTied: r2(outstandingAR),
    },
    issues: v.issues,
  };
}

function summarize(months: MonthRow[], size: number, prefix: string): PeriodSummary[] {
  const out: PeriodSummary[] = [];
  for (let i = 0; i < months.length; i += size) {
    const ch = months.slice(i, i + size);
    const s = (k: keyof MonthRow) => ch.reduce((a, r) => a.plus(r[k]), D(0));
    out.push({
      label: `${prefix}${i / size + 1}`, revenue: r2(s("revenue")), grossProfit: r2(s("grossProfit")),
      operatingProfit: r2(s("operatingProfit")), netProfit: r2(s("netProfit")), netCash: r2(s("netCash")),
      closingCash: ch[ch.length - 1].closingCash,
    });
  }
  return out;
}

function emptyResult(currency: string, issues: ValidationIssue[]): ModelResult {
  return {
    currency, months: [], quarters: [], years: [],
    totals: { revenue: 0, grossProfit: 0, operatingProfit: 0, netProfit: 0, netCash: 0 },
    grossMarginPct: null, operatingMarginPct: null, products: [],
    breakEven: { runRateMonth: 0, monthlyFixedCosts: 0, weightedUnitContribution: null, contributionMarginPct: null, breakEvenRevenue: null, breakEvenUnits: null, marginOfSafetyPct: null, firstProfitableMonth: null, paybackMonth: null, formula: "" },
    funding: { startupCosts: 0, peakFundingNeed: 0, peakMonth: null, totalFundingPlanned: 0, fundingGap: 0, minClosingCash: 0, runwayMonths: null, workingCapitalTied: 0 },
    issues,
  };
}
