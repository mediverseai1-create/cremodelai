import { z } from "zod";

const pct = z.number().min(-100).max(1000);
const money = z.number().min(0);

export const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "KES", "ZAR", "GHS", "INR", "CAD", "AUD", "AED"] as const;

export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  kind: z.enum(["product", "service", "subscription"]),
  price: money,
  unitCost: money, // direct variable cost per unit
  startVolume: money, // units (or customers) in month 1
  monthlyGrowthPct: pct, // compound monthly volume growth
  discountPct: z.number().min(0).max(100).default(0),
  churnPct: z.number().min(0).max(100).optional(), // subscriptions: monthly churn
  newCustomersPerMonth: money.optional(), // subscriptions: gross adds
});

export const fixedCostSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.enum(["rent", "software", "utilities", "insurance", "admin", "marketing", "other"]),
  monthly: money,
  annualGrowthPct: pct.default(0),
});

export const variableCostSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  pctOfRevenue: z.number().min(0).max(100),
});

export const staffSchema = z.object({
  id: z.string(),
  role: z.string().min(1),
  department: z.string().default("General"),
  headcount: z.number().int().min(1),
  monthlySalary: money,
  benefitsPct: z.number().min(0).max(100).default(0),
  startMonth: z.number().int().min(1),
});

export const investmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  amount: money,
  month: z.number().int().min(1),
});

export const fundingSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["founder", "investment", "loan", "grant", "other"]),
  amount: money,
  month: z.number().int().min(1),
});

export const modelInputsSchema = z.object({
  currency: z.enum(CURRENCIES),
  horizonMonths: z.number().int().min(1).max(120),
  openingCash: money,
  receivablesDays: z.number().min(0).max(180).default(0),
  taxRatePct: z.number().min(0).max(100).default(0),
  products: z.array(productSchema),
  fixedCosts: z.array(fixedCostSchema),
  variableCosts: z.array(variableCostSchema),
  staff: z.array(staffSchema),
  investments: z.array(investmentSchema),
  funding: z.array(fundingSchema),
});

export type Product = z.infer<typeof productSchema>;
export type FixedCost = z.infer<typeof fixedCostSchema>;
export type VariableCost = z.infer<typeof variableCostSchema>;
export type Staff = z.infer<typeof staffSchema>;
export type Investment = z.infer<typeof investmentSchema>;
export type Funding = z.infer<typeof fundingSchema>;
export type ModelInputs = z.infer<typeof modelInputsSchema>;

export interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

export interface MonthRow {
  month: number;
  revenue: number;
  directCosts: number;
  grossProfit: number;
  variableCosts: number;
  contribution: number;
  fixedCosts: number;
  staffCosts: number;
  operatingProfit: number;
  tax: number;
  netProfit: number;
  cashReceipts: number;
  cashOperatingOut: number; // direct + variable + fixed + staff + tax
  investmentOut: number;
  financingIn: number;
  netCash: number;
  closingCash: number;
}

export interface PeriodSummary {
  label: string;
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  netCash: number;
  closingCash: number;
}

export interface ProductResult {
  id: string;
  name: string;
  revenue: number;
  directCosts: number;
  variableCosts: number;
  contribution: number;
  contributionMarginPct: number | null;
  grossMarginPct: number | null;
  unitContribution: number;
  breakEvenUnitsMonthly: number | null; // stand-alone, allocating all run-rate fixed costs
}

export interface BreakEven {
  runRateMonth: number;
  monthlyFixedCosts: number;
  weightedUnitContribution: number | null;
  contributionMarginPct: number | null;
  breakEvenRevenue: number | null;
  breakEvenUnits: number | null;
  marginOfSafetyPct: number | null;
  firstProfitableMonth: number | null;
  paybackMonth: number | null; // cumulative cash (excl. financing) back above zero after the trough
  formula: string;
}

export interface FundingResult {
  startupCosts: number;
  peakFundingNeed: number; // largest cumulative cash deficit vs. opening cash, excluding financing
  peakMonth: number | null;
  totalFundingPlanned: number;
  fundingGap: number; // max(0, -min closing cash)
  minClosingCash: number;
  runwayMonths: number | null; // month cash first goes negative; null = never within the horizon
  workingCapitalTied: number; // receivables outstanding at end of horizon
}

export interface ModelResult {
  currency: string;
  months: MonthRow[];
  quarters: PeriodSummary[];
  years: PeriodSummary[];
  totals: { revenue: number; grossProfit: number; operatingProfit: number; netProfit: number; netCash: number };
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  products: ProductResult[];
  breakEven: BreakEven;
  funding: FundingResult;
  issues: ValidationIssue[];
}
