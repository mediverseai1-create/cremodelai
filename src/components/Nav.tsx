"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const NAV: [string, string][] = [
  ["Overview", "/app"], ["My Business Models", "/app/models"], ["Financial Modeling", "/app/go/profile"],
  ["Revenue & Pricing", "/app/go/revenue"], ["Costs & Expenses", "/app/go/costs"], ["Profitability", "/app/go/profitability"],
  ["Break-even Analysis", "/app/go/breakeven"], ["Cash Flow", "/app/go/cashflow"], ["Scenario Planner", "/app/go/scenarios"],
  ["Startup Viability", "/app/go/ai"], ["Funding Requirements", "/app/go/funding"], ["Business Plan Builder", "/app/go/plan"],
  ["AI Insights", "/app/insights"], ["Ask CreModelAI", "/app/ask"], ["Actions", "/app/actions"], ["Reports", "/app/reports"],
  ["AI Agents", "/app/agents"], ["Data & Imports", "/app/imports"], ["Team & Permissions", "/app/team"],
  ["Usage & Billing", "/app/billing"], ["Settings", "/app/settings"],
];

export function Nav({ email }: { email: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <nav aria-label="Main" className="px-3 pb-6">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV.map(([label, href]) => {
          const active = href === "/app" ? path === "/app" : !href.startsWith("/app/go") && path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-gold text-[#2a2110]" : "text-cream/80 hover:bg-white/10"}`}>{label}</Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 hidden border-t border-white/15 px-3 pt-4 text-xs lg:block">
        <p className="truncate opacity-70">{email}</p>
        <button className="mt-2 font-semibold underline" onClick={async () => { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }}>Sign out</button>
      </div>
    </nav>
  );
}
