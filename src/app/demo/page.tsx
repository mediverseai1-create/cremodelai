import Link from "next/link";
import Workspace from "@/components/Workspace";
import { Logo } from "@/components/Logo";
import { DEMO_MODEL } from "@/lib/engine/sample";

export const metadata = { title: "Interactive demo" };

export default function Demo() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between"><Link href="/"><Logo /></Link><Link href="/signup" className="btn btn-primary">Create your account</Link></div>
      <p className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-warn">This is <b>demonstration data</b> for a made-up business. Edit any assumption to see the engine recalculate. Nothing is saved, and AI features need an account.</p>
      <Workspace demo modelId={null} orgId={null} userId={null} canEdit name="Demo business model" initial={DEMO_MODEL} initialTab="revenue" />
    </div>
  );
}
