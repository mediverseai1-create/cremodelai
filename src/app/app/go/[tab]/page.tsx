import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

/** Sidebar shortcuts: open a section of the most recently updated active model. */
export default async function Go({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  const { supabase, org } = await getAppContext();
  const { data } = await supabase.from("business_models").select("id").eq("org_id", org.id).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) redirect("/app/models?need=model");
  redirect(`/app/models/${data.id}?tab=${encodeURIComponent(tab)}`);
}
