export const TABS = [
  ["profile", "Business profile"], ["revenue", "Revenue & pricing"], ["costs", "Costs"], ["staffing", "Staffing"],
  ["investments", "Investments"], ["funding", "Funding"], ["projections", "Projections"], ["profitability", "Profitability"],
  ["breakeven", "Break-even"], ["cashflow", "Cash flow"], ["scenarios", "Scenarios"], ["ai", "AI analysis"],
  ["plan", "Business plan"], ["reports", "Reports"], ["history", "History"],
] as const;
export type TabKey = (typeof TABS)[number][0];
