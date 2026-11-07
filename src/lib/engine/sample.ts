import type { ModelInputs } from "./types";

/** DEMONSTRATION DATA ONLY. Labelled as such in the UI; never presented as real user data. */
export const DEMO_MODEL: ModelInputs = {
  currency: "USD", horizonMonths: 24, openingCash: 0, receivablesDays: 30, taxRatePct: 0,
  products: [
    { id: "p1", name: "Demo Product A", kind: "product", price: 50, unitCost: 18, startVolume: 200, monthlyGrowthPct: 4, discountPct: 0 },
    { id: "p2", name: "Demo Service B", kind: "service", price: 120, unitCost: 40, startVolume: 40, monthlyGrowthPct: 3, discountPct: 5 },
  ],
  fixedCosts: [
    { id: "f1", name: "Rent", category: "rent", monthly: 2500, annualGrowthPct: 3 },
    { id: "f2", name: "Software", category: "software", monthly: 600, annualGrowthPct: 0 },
    { id: "f3", name: "Marketing", category: "marketing", monthly: 1500, annualGrowthPct: 0 },
  ],
  variableCosts: [{ id: "v1", name: "Payment fees", pctOfRevenue: 2.9 }],
  staff: [
    { id: "s1", role: "Operations lead", department: "Operations", headcount: 1, monthlySalary: 3500, benefitsPct: 10, startMonth: 1 },
    { id: "s2", role: "Sales associate", department: "Sales", headcount: 1, monthlySalary: 2500, benefitsPct: 10, startMonth: 4 },
  ],
  investments: [{ id: "i1", name: "Equipment & setup", amount: 30000, month: 1 }],
  funding: [{ id: "g1", name: "Founder capital", type: "founder", amount: 50000, month: 1 }],
};
