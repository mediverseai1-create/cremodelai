import ActionsClient from "@/components/ActionsClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Actions" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const [{ data: actions }, { data: models }] = await Promise.all([
    supabase.from("recommended_actions").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("business_models").select("id,name").eq("org_id", org.id).eq("status", "active"),
  ]);
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Actions &amp; decisions</h1><ActionsClient initial={actions ?? []} models={models ?? []} orgId={org.id} userId={user.id} canEdit={canEdit} /></div>;
}
