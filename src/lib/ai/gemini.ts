import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export class AiUnavailableError extends Error {}

export const aiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Evidence labels so users can tell calculations from interpretations. */
export const SYSTEM_RULES = `You are an analyst inside CreModelAI, an AI revenue platform that reads a team's sales data, pipeline and calls.
Rules:
- All numbers you are given were produced by a deterministic analytics engine from the user's own data. NEVER compute new authoritative figures or alter them; only interpret and cite them.
- Clearly separate: (a) calculated results, (b) user-provided data and notes, (c) your interpretation, (d) missing information. Do not invent market research, competitor data, statistics or external evidence. If a fact is not in the provided data, say it is unknown.
- Never guarantee outcomes. Suggestions are based only on the supplied data and are not guarantees.
- Be concise and specific, referencing the model figures by name.`;

async function callGemini(prompt: string, json: boolean, attempts = 2): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiUnavailableError("GEMINI_API_KEY is not configured");
  const ai = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 45000 } });
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
        contents: prompt,
        config: { systemInstruction: SYSTEM_RULES, ...(json ? { responseMimeType: "application/json" } : {}), temperature: 0.3 },
      });
      const text = res.text;
      if (!text) throw new Error("Empty response");
      return text;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw new AiUnavailableError(lastErr instanceof Error ? lastErr.message : "Gemini request failed");
}

/** Structured call: parses JSON and validates with Zod, retrying once on malformed output. */
export async function generateStructured<T extends z.ZodTypeAny>(prompt: string, schema: T): Promise<z.infer<T>> {
  let lastIssue = "";
  for (let i = 0; i < 2; i++) {
    const text = await callGemini(i === 0 ? prompt : `${prompt}\n\nYour previous reply was invalid (${lastIssue}). Reply with valid JSON only.`, true, 1);
    try {
      const parsed = schema.safeParse(JSON.parse(text.replace(/^```json\s*|```$/g, "").trim()));
      if (parsed.success) return parsed.data;
      lastIssue = parsed.error.issues[0]?.message ?? "schema mismatch";
    } catch {
      lastIssue = "not parseable JSON";
    }
  }
  console.error("Gemini structured output rejected:", lastIssue);
  throw new Error("AI returned a malformed response. Please try again.");
}

export const generateText = (prompt: string) => callGemini(prompt, false);
