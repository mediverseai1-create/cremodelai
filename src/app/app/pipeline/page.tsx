import PipelineClient, { type Deal } from "@/components/PipelineClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Pipeline" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const { data } = await supabase.from("pipeline_deals").select("id,name,account,owner,stage,value,expected_close,follow_up_on,last_contact,notes").eq("org_id", org.id).order("created_at", { ascending: false });
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Pipeline</h1><PipelineClient initial={(data ?? []) as Deal[]} orgId={org.id} userId={user.id} cur={org.currency} canEdit={canEdit} /></div>;
}
