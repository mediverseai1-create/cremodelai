import ModelsList from "@/components/ModelsList";
import { getAppContext } from "@/lib/app-context";
import { loadModelSummaries } from "@/lib/load-models";

export const metadata = { title: "My Business Models" };

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const { need } = await searchParams;
  const { supabase, user, org, canEdit } = await getAppContext();
  const models = await loadModelSummaries(supabase, org.id);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">My Business Models</h1>
      {need && <p className="rounded-lg bg-amber-50 p-3 text-sm text-warn">Create a business model first to open that section.</p>}
      <ModelsList models={models} orgId={org.id} userId={user.id} currency={org.currency} horizon={org.planning_horizon_months} canEdit={canEdit} />
    </div>
  );
}
