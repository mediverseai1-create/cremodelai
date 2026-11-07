import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Trusted payment confirmation endpoint. Called by YOUR payment provider's webhook (or an
 * automation you control) with the shared secret. Returning from an external payment page never
 * activates a plan. Adapt the body mapping to your provider once payment links are chosen.
 */
const schema = z.object({ orgId: z.string().uuid(), plan: z.enum(["professional", "enterprise"]), status: z.enum(["active", "past_due", "canceled"]).default("active"), periodEnd: z.string().datetime().optional() });

export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-webhook-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { orgId, plan, status, periodEnd } = parsed.data;
  const admin = createServiceClient();
  const { error } = await admin.from("subscriptions").upsert({ org_id: orgId, plan, status, activated_by: "payment_webhook", current_period_end: periodEnd ?? null, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "Could not update subscription" }, { status: 500 });
  await admin.from("audit_logs").insert({ org_id: orgId, action: "subscription.updated", entity: "subscription", detail: { plan, status } });
  return NextResponse.json({ ok: true });
}
