import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeModel } from "@/lib/engine/calc";
import { modelInputsSchema } from "@/lib/engine/types";

export interface ModelSummary {
  id: string; name: string; status: string; updated_at: string; currency: string;
  revenue: number; operatingProfit: number; breakEvenRevenue: number | null; fundingGap: number; minCash: number;
  firstProfitableMonth: number | null; warnings: number; valid: boolean;
}

/** Loads models and recomputes their results from the saved inputs with the deterministic engine. */
export async function loadModelSummaries(sb: SupabaseClient, orgId: string, includeArchived = false): Promise<ModelSummary[]> {
  let q = sb.from("business_models").select("id,name,status,updated_at,current_version_id").eq("org_id", orgId).order("updated_at", { ascending: false });
  if (!includeArchived) q = q.eq("status", "active");
  const { data: models } = await q;
  if (!models?.length) return [];
  const ids = models.map((m) => m.current_version_id).filter(Boolean);
  const { data: vers } = await sb.from("financial_model_versions").select("id,inputs").in("id", ids);
  const byId = new Map((vers ?? []).map((v) => [v.id, v.inputs]));
  return models.map((m) => {
    const p = modelInputsSchema.safeParse(byId.get(m.current_version_id));
    const r = p.success ? computeModel(p.data) : null;
    return {
      id: m.id, name: m.name, status: m.status, updated_at: m.updated_at, currency: p.success ? p.data.currency : "USD",
      revenue: r?.totals.revenue ?? 0, operatingProfit: r?.totals.operatingProfit ?? 0, breakEvenRevenue: r?.breakEven.breakEvenRevenue ?? null,
      fundingGap: r?.funding.fundingGap ?? 0, minCash: r?.funding.minClosingCash ?? 0, firstProfitableMonth: r?.breakEven.firstProfitableMonth ?? null,
      warnings: r?.issues.length ?? 0, valid: p.success,
    };
  });
}
