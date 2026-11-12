import LeadsClient, { type Lead } from "@/components/LeadsClient";
import { getAppContext } from "@/lib/app-context";
import { deriveIcp, loadSales } from "@/lib/revenue/load";

export const metadata = { title: "Lead Finder" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const [{ rows }, { data }] = await Promise.all([
    loadSales(supabase, org.id),
    supabase.from("lead_candidates").select("id,name,industry,region,notes,score,reasoning").eq("org_id", org.id).order("score", { ascending: false, nullsFirst: false }),
  ]);
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Lead Finder</h1><LeadsClient initial={(data ?? []) as Lead[]} icp={deriveIcp(rows)} orgId={org.id} userId={user.id} canEdit={canEdit} /></div>;
}
