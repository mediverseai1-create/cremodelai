import { z } from "zod";
import type { ModelInputs, ModelResult } from "@/lib/engine/types";
import type { UsageKind } from "@/lib/plans";

export const analysisSchema = z.object({
  summary: z.string(),
  findings: z.array(z.object({
    title: z.string(),
    detail: z.string(),
    evidence: z.enum(["calculation", "assumption", "interpretation", "unverified"]),
    severity: z.enum(["info", "warning", "risk"]),
  })).max(12),
  recommendations: z.array(z.object({ title: z.string(), rationale: z.string(), priority: z.enum(["low", "medium", "high"]) })).max(8),
  missingInformation: z.array(z.string()).max(10),
  limitations: z.string(),
});
export type Analysis = z.infer<typeof analysisSchema>;

export const planSchema = z.object({ sections: z.array(z.object({ title: z.string(), body: z.string() })).min(1).max(20) });
export const askSchema = z.object({ answer: z.string(), references: z.array(z.string()).max(10), missingInformation: z.array(z.string()).max(6) });

export const PLAN_SECTIONS = [
  "Executive summary", "Business overview", "Problem and solution", "Products and services", "Target market",
  "Business model", "Revenue strategy", "Marketing and sales strategy", "Operations plan", "Staffing plan",
  "Financial assumptions", "Financial projections", "Break-even analysis", "Funding requirements", "Financial risks", "Growth strategy",
];

export interface AgentDef {
  key: string;
  label: string;
  purpose: string;
  usage: UsageKind;
  schema: z.ZodTypeAny;
  instruction: string;
}

const A = analysisSchema;
export const AGENTS: Record<string, AgentDef> = {
  business_model_analyst: { key: "business_model_analyst", label: "Business Model Analyst", purpose: "Evaluates how pricing, volume, costs, staffing, growth, investment and funding relate, and flags unsupported assumptions.", usage: "ai_analysis", schema: A, instruction: "Evaluate the relationship between pricing, sales volume, costs, staffing, growth, investment and funding. Identify gaps and unrealistic or unsupported assumptions." },
  financial_planning: { key: "financial_planning", label: "Financial Planning Agent", purpose: "Explains the projections and highlights the most important changes over time.", usage: "ai_analysis", schema: A, instruction: "Explain the financial projections and highlight the most important changes across months, quarters and years." },
  startup_viability: { key: "startup_viability", label: "Startup Viability Agent", purpose: "Produces a structured feasibility assessment and lists assumptions to validate.", usage: "ai_analysis", schema: A, instruction: "Produce a structured feasibility assessment covering revenue model, cost structure, break-even, margins, capital requirements, runway, key financial risks, missing information, assumptions requiring validation and next steps. Do not say the business will definitely succeed or fail." },
  scenario_analysis: { key: "scenario_analysis", label: "Scenario Analysis Agent", purpose: "Explains differences between scenarios and the drivers that matter most.", usage: "ai_analysis", schema: A, instruction: "Explain the differences between the provided scenario results and identify the assumptions that drive outcomes the most." },
  pricing_intelligence: { key: "pricing_intelligence", label: "Pricing Intelligence Agent", purpose: "Analyzes prices, margins, contribution and profitability by product.", usage: "ai_analysis", schema: A, instruction: "Analyze pricing, gross and contribution margins and product profitability. Point out underpriced products and profitability opportunities, using only the figures provided." },
  funding_intelligence: { key: "funding_intelligence", label: "Funding Intelligence Agent", purpose: "Explains capital requirements, funding gaps, working capital and cash pressure.", usage: "ai_analysis", schema: A, instruction: "Explain capital requirements, the projected funding gap, working-capital needs and cash pressure points. Clearly distinguish cash flow from accounting profit." },
  executive_reporting: { key: "executive_reporting", label: "Executive Reporting Agent", purpose: "Writes a management summary of the model.", usage: "report_generation", schema: A, instruction: "Write a concise executive financial summary for management: headline results, key risks, assumptions to validate and recommended decisions." },
  business_plan: { key: "business_plan", label: "Business Plan Agent", purpose: "Drafts business plan sections from the saved profile and financial model.", usage: "plan_generation", schema: planSchema, instruction: `Draft these business plan sections in order: ${PLAN_SECTIONS.join("; ")}. Financial sections must quote only the supplied calculated figures. Where the profile lacks information (e.g. market data, competitors), write what the user must supply instead of inventing it. Return {"sections":[{"title","body"}]}.` },
  ask: { key: "ask", label: "Ask CreModelAI", purpose: "Answers questions about your saved models using calculated outputs.", usage: "ai_analysis", schema: askSchema, instruction: 'Answer the user\'s question using only the supplied model data. Return {"answer", "references" (names of the model figures/assumptions you used), "missingInformation"}. If the question needs data that is not present, say what is needed.' },
};

export function buildContext(name: string, inputs: ModelInputs, r: ModelResult, extra?: unknown) {
  const compactMonths = r.months.length > 36 ? r.months.filter((m) => m.month % 3 === 0) : r.months;
  return JSON.stringify({
    businessModel: name,
    currency: r.currency,
    userAssumptions: inputs,
    calculated: {
      totals: r.totals, grossMarginPct: r.grossMarginPct, operatingMarginPct: r.operatingMarginPct,
      breakEven: r.breakEven, funding: r.funding, products: r.products, years: r.years, quarters: r.quarters,
      months: compactMonths.map((m) => ({ month: m.month, revenue: m.revenue, operatingProfit: m.operatingProfit, closingCash: m.closingCash })),
      validationWarnings: r.issues,
    },
    ...(extra ? { additional: extra } : {}),
  });
}

const ANALYSIS_SHAPE = `\n\nReturn ONLY JSON of exactly this shape: {"summary": string, "findings": [{"title": string, "detail": string, "evidence": "calculation"|"assumption"|"interpretation"|"unverified", "severity": "info"|"warning"|"risk"}] (max 12), "recommendations": [{"title": string, "rationale": string, "priority": "low"|"medium"|"high"}] (max 8), "missingInformation": [string], "limitations": string}.`;
for (const a of Object.values(AGENTS)) if (a.schema === analysisSchema) a.instruction += ANALYSIS_SHAPE;
