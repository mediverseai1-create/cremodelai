import { notFound } from "next/navigation";
import Workspace, { type VersionRow } from "@/components/Workspace";
import { TABS, type TabKey } from "@/lib/tabs";
import { getAppContext } from "@/lib/app-context";
import { modelInputsSchema } from "@/lib/engine/types";

export default async function ModelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  const { supabase, user, org, canEdit } = await getAppContext();
  const { data: model } = await supabase.from("business_models").select("id,name,org_id,current_version_id").eq("id", id).maybeSingle();
  if (!model || model.org_id !== org.id) notFound();
  const { data: versions } = await supabase.from("financial_model_versions").select("id,version_number,created_at,note,inputs").eq("model_id", id).order("version_number", { ascending: false });
  const current = versions?.find((v) => v.id === model.current_version_id) ?? versions?.[0];
  const parsed = modelInputsSchema.safeParse(current?.inputs);
  if (!parsed.success) {
    return <div className="card p-6"><h1 className="font-display text-xl font-bold">This model&apos;s saved inputs could not be read</h1><p className="mt-2 text-sm text-muted">{parsed.error.issues[0]?.message}</p></div>;
  }
  const initialTab = (TABS.some(([k]) => k === tab) ? tab : "profile") as TabKey;
  return (
    <Workspace key={`${id}-${initialTab}`} demo={false} modelId={id} orgId={org.id} userId={user.id} canEdit={canEdit}
      name={model.name} initial={parsed.data} initialTab={initialTab} versions={(versions ?? []) as VersionRow[]} />
  );
}
