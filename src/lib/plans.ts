/**
 * Central plan configuration.
 * Entitlements/limits are intentionally NOT invented. Set a number to enforce a rolling 30-day limit
 * for a usage kind on that plan; `null`/missing means "no limit configured yet" (not enforced).
 */
export type PlanKey = "free" | "professional" | "enterprise";
export type UsageKind = "briefing" | "ask" | "follow_up" | "conversation_analysis" | "lead_scoring" | "data_import";

export const USAGE_LABELS: Record<UsageKind, string> = {
  briefing: "Sales briefings", ask: "Questions asked", follow_up: "Follow-up drafts",
  conversation_analysis: "Conversation analyses", lead_scoring: "Lead scoring runs", data_import: "Data imports",
};

export const PLANS: Record<PlanKey, {
  name: string; priceMonthly: number | null; blurb: string; features: string[];
  limits: Partial<Record<UsageKind, number | null>>;
}> = {
  free: { name: "Free", priceMonthly: null, blurb: "Look around.", features: ["Sales data upload", "Deterministic revenue analytics"], limits: {} },
  professional: {
    name: "Professional", priceMonthly: 47, blurb: "For founders and small sales teams.",
    features: ["Sales briefings on any cadence", "Next best actions queue", "Follow-up drafting", "Ask in plain language", "Pipeline and sales-data imports"],
    limits: {},
  },
  enterprise: {
    name: "Enterprise", priceMonthly: 97, blurb: "For revenue teams that run on the numbers.",
    features: ["Everything in Professional", "Call and transcript analysis", "Lead finder with scoring", "Team roles and permissions", "Audit trail"],
    limits: {},
  },
};

export function paymentLink(plan: "professional" | "enterprise"): string | null {
  const v = plan === "professional" ? process.env.PROFESSIONAL_PAYMENT_LINK : process.env.ENTERPRISE_PAYMENT_LINK;
  return v && v.startsWith("http") ? v : null;
}
