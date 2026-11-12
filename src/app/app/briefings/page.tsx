import BriefingsClient, { type BriefingRow } from "@/components/BriefingsClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Briefings" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("briefings").select("id,cadence,period_start,period_end,created_at,metrics,content").eq("org_id", org.id).order("created_at", { ascending: false }).limit(25),
    supabase.from("sales_records").select("id", { count: "exact", head: true }).eq("org_id", org.id),
  ]);
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Briefings</h1><BriefingsClient rows={(data ?? []) as BriefingRow[]} orgId={org.id} userId={user.id} cur={org.currency} canEdit={canEdit} hasData={(count ?? 0) > 0} /></div>;
}
