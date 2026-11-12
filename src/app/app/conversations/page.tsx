import ConversationsClient, { type Conv } from "@/components/ConversationsClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Conversations" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const [{ data }, { data: deals }] = await Promise.all([
    supabase.from("conversations").select("id,title,transcript,analysis,created_at,deal_id").eq("org_id", org.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("pipeline_deals").select("id,name").eq("org_id", org.id).order("name"),
  ]);
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Conversations</h1><ConversationsClient initial={(data ?? []) as Conv[]} deals={deals ?? []} orgId={org.id} userId={user.id} canEdit={canEdit} /></div>;
}
