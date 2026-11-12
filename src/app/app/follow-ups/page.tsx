import FollowUpsClient from "@/components/FollowUpsClient";
import type { Deal } from "@/components/PipelineClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Follow-Ups" };
export default async function Page() {
  const { supabase, org, canEdit } = await getAppContext();
  const { data } = await supabase.from("pipeline_deals").select("id,name,account,owner,stage,value,expected_close,follow_up_on,last_contact,notes").eq("org_id", org.id).order("follow_up_on", { nullsFirst: false });
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Follow-Ups</h1><p className="max-w-3xl text-sm text-muted">Who needs a follow-up, why, when, and what to say. Triage is calculated from your pipeline dates; the AI only drafts the message.</p><FollowUpsClient deals={(data ?? []) as Deal[]} canEdit={canEdit} /></div>;
}
