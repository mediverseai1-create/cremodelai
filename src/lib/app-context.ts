import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const EDIT_ROLES = ["owner", "administrator", "founder", "cfo", "analyst", "consultant", "finance_manager"];
export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", administrator: "Admin", founder: "Founder", cfo: "Revenue Leader",
  analyst: "Analyst", consultant: "Consultant", finance_manager: "Sales Manager", viewer: "Member (view only)",
};

/** Loads the signed-in user and their (first) organization; redirects to login/onboarding when missing. */
export async function getAppContext(opts: { allowNoOrg?: boolean } = {}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: memberships } = await supabase
    .from("organization_members").select("role, organizations(id, name, currency, planning_horizon_months, industry)").eq("user_id", data.user.id).order("created_at");
  const first = memberships?.[0];
  const org = first?.organizations as unknown as { id: string; name: string; currency: string; planning_horizon_months: number; industry: string | null } | undefined;
  if (!org && !opts.allowNoOrg) redirect("/app/onboarding");
  const role = (first?.role as string) ?? "viewer";
  return { supabase, user: data.user, org: org!, role, canEdit: EDIT_ROLES.includes(role), isAdmin: role === "owner" || role === "administrator" };
}
