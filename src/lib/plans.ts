/**
 * Central plan configuration.
 * Entitlements/limits are intentionally NOT invented. Set a number to enforce a monthly limit for
 * a usage kind on that plan; `null` means "no limit configured yet" (not enforced).
 */
export type PlanKey = "free" | "professional" | "enterprise";
export type UsageKind =
  | "ai_analysis" | "agent_run" | "model_generation" | "scenario_simulation"
  | "document_extraction" | "plan_generation" | "report_generation";

export const USAGE_LABELS: Record<UsageKind, string> = {
  ai_analysis: "AI analyses", agent_run: "AI agent runs", model_generation: "Model generations",
  scenario_simulation: "Scenario simulations", document_extraction: "Document extractions",
  plan_generation: "Business plan generations", report_generation: "Report generations",
};

export const PLANS: Record<PlanKey, {
  name: string; priceMonthly: number | null; blurb: string; features: string[];
  limits: Partial<Record<UsageKind, number | null>>;
}> = {
  free: { name: "Free", priceMonthly: null, blurb: "Explore the platform.", features: ["Financial model workspace", "Deterministic calculation engine"], limits: {} },
  professional: {
    name: "Professional", priceMonthly: 47, blurb: "For founders and small businesses.",
    features: ["Unlimited saved business models", "Scenario planner", "Startup viability analysis", "Pricing & profitability intelligence", "Business plan builder", "Ask CreModelAI"],
    limits: {},
  },
  enterprise: {
    name: "Enterprise", priceMonthly: 97, blurb: "For finance teams, consultants and studios.",
    features: ["Everything in Professional", "Team roles & permissions", "Spreadsheet & PDF imports", "Executive reporting", "AI agents workspace", "Audit trail"],
    limits: {},
  },
};

export function paymentLink(plan: "professional" | "enterprise"): string | null {
  const v = plan === "professional" ? process.env.PROFESSIONAL_PAYMENT_LINK : process.env.ENTERPRISE_PAYMENT_LINK;
  return v && v.startsWith("http") ? v : null;
}
