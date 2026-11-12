"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const NAV: [string, string][] = [
  ["Overview", "/app"], ["Sales Data", "/app/data"], ["Briefings", "/app/briefings"], ["Next Best Actions", "/app/actions"],
  ["Pipeline", "/app/pipeline"], ["Follow-Ups", "/app/follow-ups"], ["Conversations", "/app/conversations"],
  ["Lead Finder", "/app/leads"], ["Ask", "/app/ask"], ["Team & Permissions", "/app/team"], ["Usage & Billing", "/app/billing"], ["Settings", "/app/settings"],
];

export function Nav({ email }: { email: string }) {
  const path = usePathname();
  const router = useRouter();
  const out = async () => { await createClient().auth.signOut(); router.push("/login"); router.refresh(); };
  return (
    <nav aria-label="Main" className="px-3 pb-6">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV.map(([label, href]) => {
          const active = href === "/app" ? path === "/app" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-gold text-[#2a2110]" : "text-cream/80 hover:bg-white/10"}`}>{label}</Link>
            </li>
          );
        })}
        <li className="lg:hidden"><button className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-cream/80" onClick={out}>Sign out</button></li>
      </ul>
      <div className="mt-4 hidden border-t border-white/15 px-3 pt-4 text-xs lg:block">
        <p className="truncate opacity-70">{email}</p>
        <button className="mt-2 font-semibold underline" onClick={out}>Sign out</button>
      </div>
    </nav>
  );
}
