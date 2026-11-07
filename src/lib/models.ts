import type { SupabaseClient } from "@supabase/supabase-js";
import { CURRENCIES, type ModelInputs } from "@/lib/engine/types";

export function emptyInputs(currency: string, horizon: number): ModelInputs {
  return {
    currency: (CURRENCIES as readonly string[]).includes(currency) ? (currency as ModelInputs["currency"]) : "USD",
    horizonMonths: horizon, openingCash: 0, receivablesDays: 0, taxRatePct: 0,
    products: [], fixedCosts: [], variableCosts: [], staff: [], investments: [], funding: [],
  };
}

/** Creates a business model with its first version and calculated-output record. */
export async function createModel(sb: SupabaseClient, orgId: string, userId: string, name: string, inputs: ModelInputs, profile?: Record<string, string>) {
  const { data: m, error } = await sb.from("business_models").insert({ org_id: orgId, name, created_by: userId }).select("id").single();
  if (error || !m) throw new Error(error?.message ?? "Could not create model");
  const { data: v, error: e2 } = await sb.from("financial_model_versions").insert({ org_id: orgId, model_id: m.id, version_number: 1, inputs, created_by: userId, note: "Initial version" }).select("id").single();
  if (e2 || !v) throw new Error(e2?.message ?? "Could not create version");
  await sb.from("business_models").update({ current_version_id: v.id }).eq("id", m.id);
  if (profile) await sb.from("business_profiles").insert({ model_id: m.id, org_id: orgId, ...profile });
  await sb.from("model_change_history").insert({ org_id: orgId, model_id: m.id, user_id: userId, summary: "Model created" });
  return m.id as string;
}
