import TeamClient from "@/components/TeamClient";
import { ROLE_LABELS, getAppContext } from "@/lib/app-context";

export const metadata = { title: "Team & Permissions" };
export default async function Page() {
  const { supabase, user, org, isAdmin } = await getAppContext();
  const { data: members } = await supabase.from("organization_members").select("user_id,role").eq("org_id", org.id).order("created_at");
  // Profiles are readable only for yourself under RLS, so teammates are shown by short id unless it is you.
  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const rows = (members ?? []).map((m) => ({ ...m, name: m.user_id === user.id ? me?.full_name || user.email || "You" : null }));
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Team &amp; Permissions</h1><TeamClient members={rows} orgId={org.id} roles={ROLE_LABELS} isAdmin={isAdmin} meId={user.id} /></div>;
}
