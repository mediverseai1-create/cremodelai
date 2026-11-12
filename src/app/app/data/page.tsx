import SalesImport from "@/components/SalesImport";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Sales Data" };
export default async function Page() {
  const { supabase, user, org, canEdit } = await getAppContext();
  const [{ count }, { data: history }] = await Promise.all([
    supabase.from("sales_records").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("data_imports").select("id,file_name,summary,created_at,status").eq("org_id", org.id).order("created_at", { ascending: false }).limit(10),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Sales Data</h1>
      <SalesImport orgId={org.id} userId={user.id} canEdit={canEdit} existing={count ?? 0} />
      {history && history.length > 0 && (
        <section className="card p-5"><h2 className="mb-3 font-display text-lg font-bold">Import history</h2>
          <table className="tbl"><thead><tr><th>File</th><th>Result</th><th>Date</th></tr></thead><tbody>
            {history.map((h) => { const s = h.summary as { imported?: number; rejected?: number; duplicates?: number } | null; return (<tr key={h.id}><td>{h.file_name}</td><td>{s ? `${s.imported} imported, ${s.rejected} rejected, ${s.duplicates} duplicates` : h.status}</td><td>{new Date(h.created_at).toLocaleDateString()}</td></tr>); })}
          </tbody></table></section>
      )}
    </div>
  );
}
