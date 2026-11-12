import { z } from "zod";
import type { UsageKind } from "@/lib/plans";

const action = z.object({ title: z.string(), reason: z.string(), account: z.string().nullable().optional(), priority: z.enum(["low", "medium", "high"]) });

export const briefingSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  performance: z.array(z.object({ area: z.string(), detail: z.string() })).max(10),
  atRisk: z.array(z.object({ title: z.string(), detail: z.string() })).max(8),
  strategy: z.array(z.object({ title: z.string(), rationale: z.string() })).max(6),
  nextActions: z.array(action).max(8),
  unusual: z.array(z.string()).max(6),
  limitations: z.string(),
});
export type Briefing = z.infer<typeof briefingSchema>;

export const askSchema = z.object({ answer: z.string(), references: z.array(z.string()).max(10), missingInformation: z.array(z.string()).max(6) });

export const followUpSchema = z.object({ whyNow: z.string(), suggestedTiming: z.string(), subject: z.string(), message: z.string() });

export const conversationSchema = z.object({
  summary: z.string(),
  buyerIntent: z.enum(["high", "medium", "low", "unclear"]),
  intentReason: z.string(),
  objections: z.array(z.object({ objection: z.string(), suggestedResponse: z.string() })).max(8),
  nextSteps: z.array(z.string()).max(8),
  commitments: z.array(z.object({ what: z.string(), when: z.string().nullable().optional() })).max(8),
  risks: z.array(z.string()).max(6),
});
export type ConversationAnalysis = z.infer<typeof conversationSchema>;

export const leadScoreSchema = z.object({ scores: z.array(z.object({ id: z.string(), score: z.number().min(0).max(100), reasoning: z.string() })) });

export interface AgentDef { key: string; label: string; purpose: string; usage: UsageKind; schema: z.ZodTypeAny; instruction: string }

export const AGENTS: Record<string, AgentDef> = {
  briefing: {
    key: "briefing", label: "Sales Briefing", usage: "briefing", schema: briefingSchema,
    purpose: "Reads the calculated revenue metrics for a period and writes a plain-English briefing: what changed, what is working, what is at risk, and what to do next.",
    instruction: `Write a sales briefing for the period in "metrics". Use ONLY the supplied numbers; never invent customers, products, amounts or causes. If you suggest a reason for a change, label it as a hypothesis to check. Every next action must name an account/product/rep from the data where possible and give the revenue reason. Return JSON: {"headline": string, "summary": string (plain English, 3-6 sentences), "performance": [{"area","detail"}], "atRisk": [{"title","detail"}], "strategy": [{"title","rationale"}] (built from what is already working in the data), "nextActions": [{"title","reason","account"(string|null),"priority":"low"|"medium"|"high"}], "unusual": [string], "limitations": string}.`,
  },
  ask: {
    key: "ask", label: "Ask in plain language", usage: "ask", schema: askSchema,
    purpose: "Answers questions about your sales data and pipeline, citing the numbers used.",
    instruction: `Answer the user's question using only the supplied data. Quote the figures you used. If the data cannot answer it, say what is missing. Return {"answer": string, "references": [short names of the figures/segments used], "missingInformation": [string]}.`,
  },
  follow_up: {
    key: "follow_up", label: "Follow-Up AI", usage: "follow_up", schema: followUpSchema,
    purpose: "Explains who needs a follow-up and why, when to do it, and drafts what to say.",
    instruction: `Using the deal details and notes, explain why a follow-up matters now, suggest timing, and draft a short, specific, non-pushy message. Do not invent facts about the prospect that are not in the notes. Return {"whyNow","suggestedTiming","subject","message"}.`,
  },
  conversation: {
    key: "conversation", label: "Conversation Intelligence", usage: "conversation_analysis", schema: conversationSchema,
    purpose: "Breaks down a call transcript: objections, buyer intent, commitments and next steps.",
    instruction: `Analyse the call transcript. Quote or closely paraphrase what was said; do not invent statements. Return {"summary","buyerIntent":"high"|"medium"|"low"|"unclear","intentReason","objections":[{"objection","suggestedResponse"}],"nextSteps":[string],"commitments":[{"what","when"(string|null)}],"risks":[string]}.`,
  },
  lead_finder: {
    key: "lead_finder", label: "Lead Finder", usage: "lead_scoring", schema: leadScoreSchema,
    purpose: "Learns your ideal customer from who already buys and scores new candidates against it.",
    instruction: `Score each candidate 0-100 for fit against the ideal-customer profile derived from the workspace's existing customers ("icp"). Base scores only on the supplied attributes; if a candidate lacks information, score conservatively and say what is unknown. Return {"scores":[{"id","score","reasoning"}]} with one entry per candidate id.`,
  },
};
