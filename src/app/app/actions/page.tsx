import ActionsClient from "@/components/ActionsClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Next Best Actions" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const { data } = await supabase.from("recommended_actions").select("id,title,description,priority,status,notes,source,created_at,completed_at").eq("org_id", org.id).order("created_at", { ascending: false });
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Next Best Actions</h1><ActionsClient initial={data ?? []} orgId={org.id} userId={user.id} canEdit={canEdit} /></div>;
}
