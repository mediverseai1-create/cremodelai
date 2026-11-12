export async function callAi<T = unknown>(body: Record<string, unknown>): Promise<{ result?: T; briefingId?: string | null; aiUnavailable?: boolean; message?: string }> {
  const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "AI request failed");
  return json;
}
