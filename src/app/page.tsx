import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PLANS } from "@/lib/plans";

const BLUE = "#2563eb";
const FEATURES = [
  { tag: "BUSINESS MODELING", title: "Model your business in minutes", body: "Enter pricing, volumes, costs, staffing, investment and funding. Every assumption is saved, versioned and tied to the numbers.", cta: "Build a model", href: "/signup", bg: "linear-gradient(135deg,#f1e8ff,#dcd0fb)", fg: "#4c1d95" },
  { tag: "SCENARIO PLANNER", title: "Test the downside before it happens", body: "Best, expected and downside cases you can edit. Change price, volume, costs or hiring and watch profit, cash and break-even recalculate.", cta: "Try the demo", href: "/demo", bg: "linear-gradient(135deg,#e3edff,#c9dafc)", fg: "#1e3a8a" },
  { tag: "PRICING & PROFITABILITY", title: "Know which products really earn", body: "Contribution margin by product, break-even pricing and a price simulator that shows the effect on margin and break-even volume.", cta: "See profitability", href: "/demo", bg: "linear-gradient(135deg,#e2f6ee,#c3ecd9)", fg: "#065f46" },
  { tag: "STARTUP VIABILITY", title: "See what funding you really need", body: "Capital requirements, cash runway and funding gaps from deterministic calculations, with AI explaining what matters and what to validate.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#ffeedd,#fddcb8)", fg: "#9a3412" },
];
const STEPS = ["Enter your assumptions or import a spreadsheet", "The engine builds projections, cash flow and break-even", "Test scenarios and price changes", "Ask AI to explain results and flag risky assumptions", "Generate your plan and reports"];
const FAQ = [
  ["Does the AI calculate my numbers?", "No. All figures come from a deterministic calculation engine. Gemini only explains and interprets the calculated results and your stated assumptions."],
  ["Will CreModelAI tell me if my business will succeed?", "No tool can. It shows what your assumptions imply for profit, cash and funding, and which assumptions need validating. Projections are estimates, not guarantees or financial advice."],
  ["Can I import my spreadsheets?", "Yes. CSV and XLSX imports include column mapping, validation and a preview of rejected and duplicate rows. PDF extraction is coming soon."],
  ["How do I pay?", "Pick a plan inside the app. Payment happens on a secure external page and your plan activates after payment is confirmed."],
];
const cta = { background: BLUE } as const;

export default function Home() {
  return (
    <div className="bg-white text-[#14142b]">
      <div className="flex items-center justify-between bg-white px-5 text-sm md:px-16">
        <div className="flex gap-8"><span className="border-b-[3px] py-3 font-semibold" style={{ borderColor: BLUE }}>For Founders</span><span className="py-3 text-[#6b7280]">For Finance Teams</span></div>
        <span className="text-[#6b7280]">EN</span>
      </div>

      <section className="relative text-white" style={{ background: "linear-gradient(135deg,#5b6aa6 0%,#7f8fc6 45%,#a9b8e6 100%)" }}>
        <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5">
          <Link href="/" className="text-white"><span className="font-display text-2xl font-extrabold tracking-tight">CreModel<span className="opacity-80">AI</span></span></Link>
          <nav className="hidden gap-8 text-sm font-semibold md:flex" aria-label="Site"><a href="#products">Products</a><a href="#how">Learn</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
          <div className="flex items-center gap-4 text-sm font-semibold"><Link href="/login">Log in</Link><Link href="/signup" className="rounded-xl px-5 py-3 text-white" style={cta}>Get started for free</Link></div>
        </header>
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-24 pt-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">Know whether your business model works.</h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/90">Build connected financial models, test pricing, costs, growth and funding scenarios, and understand what your business could achieve before you commit.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="rounded-xl px-7 py-4 font-semibold text-white" style={cta}>Build your financial model</Link><Link href="/demo" className="rounded-xl bg-white/15 px-7 py-4 font-semibold text-white">Try the demo</Link></div>
          </div>
          <div className="rounded-3xl bg-white/95 p-6 text-[#14142b] shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280]">How one change flows through</p>
            <ol className="mt-4 space-y-3 text-sm">{["Change a price or sales assumption", "Revenue, margin and break-even recalculate", "Cash flow and funding gap update", "Plan and reports follow the new numbers"].map((t, i) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={cta}>{i + 1}</span>{t}</li>))}</ol>
            <p className="mt-5 rounded-xl bg-[#eef2ff] p-3 text-xs text-[#4b5563]">Calculations are deterministic. AI explains results; it never invents your numbers.</p>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-[1200px] space-y-6 px-5 py-20">
        <h2 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight">Everything you need to make the financial decision</h2>
        {FEATURES.map((f, i) => (
          <article key={f.tag} className={`grid overflow-hidden rounded-[2rem] md:grid-cols-2 ${i % 2 ? "md:[&>div:first-child]:order-2" : ""}`} style={{ background: f.bg }}>
            <div className="grid min-h-[18rem] place-items-center p-10"><span className="font-display text-7xl font-extrabold opacity-20" style={{ color: f.fg }}>0{i + 1}</span></div>
            <div className="p-10 md:p-14">
              <p className="text-sm font-semibold tracking-widest" style={{ color: f.fg }}>{f.tag}</p>
              <h3 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight">{f.title}</h3>
              <p className="mt-5 text-lg leading-relaxed text-[#374151]">{f.body}</p>
              <Link href={f.href} className="mt-6 inline-flex items-center gap-2 font-semibold" style={{ color: BLUE }}>{f.cta} <ArrowRight size={20} className="rounded-full border-2 p-0.5" style={{ borderColor: BLUE }} /></Link>
            </div>
          </article>))}
      </section>

      <section id="how" className="bg-[#f5f7ff] py-20">
        <div className="mx-auto max-w-[1200px] px-5">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-5">{STEPS.map((s, i) => (<li key={s} className="rounded-3xl bg-white p-6 shadow-sm"><span className="font-display text-3xl font-extrabold" style={{ color: BLUE }}>{i + 1}</span><p className="mt-2 text-sm text-[#374151]">{s}</p></li>))}</ol>
          <p className="mt-10 max-w-3xl text-[#4b5563]">Built for startup founders, small-business owners, CFOs and analysts, consultants and startup studios. Reports cover projections, profitability, break-even, cash flow, scenarios and funding, with every AI insight labelled by its type of evidence.</p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1000px] px-5 py-20">
        <h2 className="text-center font-display text-4xl font-extrabold tracking-tight">Simple pricing</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(["professional", "enterprise"] as const).map((k) => { const p = PLANS[k]; return (
            <div key={k} className="rounded-[2rem] border border-[#e5e7eb] p-8" style={k === "professional" ? { borderColor: BLUE, borderWidth: 2 } : undefined}>
              <h3 className="font-display text-2xl font-extrabold">{p.name}</h3><p className="text-sm text-[#6b7280]">{p.blurb}</p>
              <p className="num my-4 font-display text-5xl font-extrabold">${p.priceMonthly}<span className="text-base font-medium text-[#6b7280]">/month</span></p>
              <ul className="mb-6 list-disc space-y-1 pl-5 text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <Link href="/signup" className="block rounded-xl py-3 text-center font-semibold text-white" style={cta}>Get started</Link>
            </div>); })}
        </div>
        <p className="mt-4 text-center text-xs text-[#6b7280]">Create an account, then choose your plan in Usage &amp; Billing. Payment is handled on an external secure page.</p>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">{FAQ.map(([q, a]) => (<details key={q} className="rounded-2xl border border-[#e5e7eb] p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-[#4b5563]">{a}</p></details>))}</div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-[1200px] rounded-[2rem] p-12 text-center text-white" style={{ background: "linear-gradient(135deg,#5b6aa6,#a9b8e6)" }}>
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Model the business. Test the numbers. Make informed decisions.</h2>
          <Link href="/signup" className="mt-8 inline-block rounded-xl px-8 py-4 font-semibold text-white" style={cta}>Get started for free</Link>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-[#6b7280]">
        <Logo /><p>© {new Date().getFullYear()} CreModelAI. Projections are estimates from user assumptions, not financial or investment advice.</p>
      </footer>
    </div>
  );
}
