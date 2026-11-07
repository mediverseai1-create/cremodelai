import AskClient from "@/components/AskClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Ask CreModelAI" };
export default async function Page() {
  const { supabase, org } = await getAppContext();
  const { data } = await supabase.from("business_models").select("id,name").eq("org_id", org.id).eq("status", "active").order("updated_at", { ascending: false });
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Ask CreModelAI</h1><AskClient models={data ?? []} /></div>;
}
