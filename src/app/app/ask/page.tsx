import AskClient from "@/components/AskClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Ask" };
export default async function Page() {
  const { supabase, org } = await getAppContext();
  const { count } = await supabase.from("sales_records").select("id", { count: "exact", head: true }).eq("org_id", org.id);
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Ask</h1><AskClient hasData={(count ?? 0) > 0} /></div>;
}
