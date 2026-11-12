import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PLANS } from "@/lib/plans";

const BLUE = "#2563eb";
const cta = { background: BLUE } as const;

const STAGES: [string, string][] = [
  ["Find", "Learns what your best customers have in common and surfaces more companies like them."],
  ["Prepare", "Gives you the account history and context before you pick up the phone."],
  ["Converse", "Turns every call into structured notes: what was asked, promised and left open."],
  ["Understand", "Reads the buyer's intent and objections so you respond to what they meant."],
  ["Follow up", "Remembers who to chase, when, and why, then drafts the message."],
  ["Close", "Keeps the next step visible on every deal until it is won or lost."],
  ["Retain", "Spots customers buying less before they say a word."],
  ["Grow", "Points at the products, segments and accounts with the most room left."],
];
const CADENCE = ["Daily", "Weekly", "Biweekly", "Monthly", "Quarterly", "Biannual", "Annual"];
const FINDS: [string, string][] = [
  ["Real trends, not noise", "Separates a genuine change in direction from ordinary month-to-month wobble."],
  ["Where the upside is", "The customers, products and regions growing fastest or with the most headroom."],
  ["Who is falling behind", "Products, accounts, regions and reps pulling below the rest of the business."],
  ["Customers cooling off", "Accounts ordering less, or less often, flagged while you can still act."],
  ["Revenue at risk", "The exposure hiding inside a total that still looks fine."],
  ["Concentration", "How much of your revenue depends on a handful of accounts."],
  ["Odd months", "Unusually high or low periods worth a second look before they mislead a forecast."],
  ["What is already working", "Your own wins, so the plan is built from evidence and not generic advice."],
];
const MODULES = [
  { tag: "BRIEFINGS", title: "A written read of your business, on your schedule", body: "Pick a rhythm and get a plain-English briefing: what changed, what is working, what is at risk, and what to do. The numbers come from a calculation engine, so the story always matches your data.", cta: "See a live example", href: "/demo", bg: "linear-gradient(135deg,#f1e8ff,#dcd0fb)", fg: "#4c1d95" },
  { tag: "NEXT BEST ACTIONS", title: "Insight that ends in a task, not a chart", body: "Every finding resolves to a named account and a reason. Add it to the queue, work it, mark it done. Nothing sits in a dashboard waiting to be interpreted.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#e3edff,#c9dafc)", fg: "#1e3a8a" },
  { tag: "FOLLOW-UPS", title: "Nothing slips because someone forgot", body: "Overdue, due today, gone quiet for two weeks. Each deal that needs attention shows why and gets a drafted message you can edit and send.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#e2f6ee,#c3ecd9)", fg: "#065f46" },
  { tag: "CONVERSATIONS", title: "Every call, broken down", body: "Paste a transcript and get the summary, buyer intent, objections with suggested responses, commitments made and the next steps, ready to act on.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#ffeedd,#fddcb8)", fg: "#9a3412" },
  { tag: "LEAD FINDER", title: "Look for more of the customers who already buy", body: "Your ideal customer is learned from your own sales: who spends most, what they buy, where they are. Candidates you add are scored against that profile, with the reasoning shown.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#fde4ef,#f9c7dc)", fg: "#9d174d" },
];
const COMPARE: [string, string][] = [
  ["A spreadsheet for sales, another for the pipeline", "One workspace that holds sales, deals, calls and actions together"],
  ["Monthly review built by hand the night before", "A briefing generated on the rhythm you choose"],
  ["Follow-ups living in someone's inbox", "A shared queue with dates, reasons and drafts"],
  ["Call notes nobody reads twice", "Structured objections, intent and commitments on every deal"],
  ["Gut feel about which customers are slipping", "Declining accounts flagged against the previous period"],
  ["Advice that could apply to any company", "Suggestions built from your own wins and your own numbers"],
];
const STEPS: [string, string][] = [
  ["Upload your sales", "Drop in a CSV or Excel export. You map the columns, preview every row, and see exactly what was accepted or rejected."],
  ["Add your pipeline", "Enter the deals you are working, with stages and follow-up dates, or add them as you go."],
  ["Get the briefing", "Choose a cadence. The engine calculates the facts; the AI writes the read and the plan."],
  ["Work the queue", "Clear next best actions, send the drafted follow-ups, and watch the next briefing reflect what you did."],
];
const DELIVERABLES: [string, string, string[]][] = [
  ["The report", "A plain-English read of the period.", ["How products, customers, regions and reps performed", "What rose, what fell, and by how much", "Anything unusual worth checking"]],
  ["The strategy", "Built from your own results.", ["Where to do more of what already works", "Which accounts and products to push", "The revenue reason behind each idea"]],
  ["The actions", "A queue, not a list of advice.", ["Named accounts and priorities", "The reason attached to every item", "One click to mark it done"]],
];
const SECURITY: [string, string][] = [
  ["Isolated at the database", "Row-level security scopes every query to your organization, so access is enforced where the data lives, not only in the interface."],
  ["Roles for the whole team", "Owners and admins manage the workspace. Others can work or just view, with permissions that match the job."],
  ["Your data stays yours", "Files, calls and notes run your workspace. They are not used to train shared models."],
  ["Honest about its limits", "Every figure is calculated, every insight is labelled as interpretation, and nothing is presented as a guarantee."],
];
const ROLES: [string, string][] = [
  ["Founders", "See the whole business in one briefing without building the report yourself."],
  ["Sales leaders", "Know which reps, regions and accounts need you this week."],
  ["Account managers", "Catch the customer who is quietly buying less and get a follow-up drafted."],
  ["Operators and analysts", "Replace the manual monthly pull with a repeatable, consistent report."],
];
const FAQ: [string, string][] = [
  ["Does the AI make up the numbers?", "No. Revenue, changes, shares and risk are calculated by a deterministic engine from your data. The AI reads those results and writes about them, and it is told not to invent customers, amounts or causes."],
  ["What data do I need to start?", "A sales export with a date, a customer and an amount per row. Product, region and rep make the findings richer. CSV and XLSX are supported; PDF is coming soon."],
  ["What happens if a row in my file is wrong?", "You see it. Rejected rows and duplicates are listed with the reason, and only clean rows are imported after you confirm."],
  ["What if the AI service is down?", "Your data, calculated figures and saved briefings keep working. A briefing can still be generated with its calculated findings and a narrative added later."],
  ["Can my whole team use it?", "Yes. Add teammates with roles, from admin to view-only. Each workspace is separate from every other."],
  ["Does it connect to my CRM?", "Not yet. Today you upload exports and manage deals inside the workspace. Live CRM connections are on the roadmap, not live."],
  ["Does it transcribe call audio?", "Not yet. You paste a transcript, and the analysis runs on that. Audio upload is coming soon."],
  ["How do I pay and cancel?", "Choose a plan in Usage & Billing. Payment happens on a secure external page and your plan activates once payment is confirmed."],
];

export default function Home() {
  return (
    <div className="bg-white text-[#14142b]">
      <div className="flex items-center justify-between bg-white px-5 text-sm md:px-16">
        <div className="flex gap-8"><span className="border-b-[3px] py-3 font-semibold" style={{ borderColor: BLUE }}>For Sales Teams</span><span className="py-3 text-[#6b7280]">For Founders</span></div>
        <span className="text-[#6b7280]">EN</span>
      </div>

      <section className="relative text-white" style={{ background: "linear-gradient(135deg,#5b6aa6 0%,#7f8fc6 45%,#a9b8e6 100%)" }}>
        <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5">
          <Link href="/" className="text-white"><span className="font-display text-2xl font-extrabold tracking-tight">CreModel<span className="opacity-80">AI</span></span></Link>
          <nav className="hidden gap-8 text-sm font-semibold md:flex" aria-label="Site"><a href="#finds">What it finds</a><a href="#modules">Modules</a><a href="#how">How it works</a><a href="#pricing">Pricing</a></nav>
          <div className="flex items-center gap-4 text-sm font-semibold"><Link href="/login">Log in</Link><Link href="/signup" className="rounded-xl px-5 py-3 text-white" style={cta}>Get started for free</Link></div>
        </header>
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-24 pt-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="mb-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">One system for revenue, not six disconnected tools</p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">Stop losing deals to a messy pipeline.</h1>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/90">CreModelAI brings your sales numbers, open deals and conversations into one workspace, then tells you what changed, what is slipping and what your team should do next.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="rounded-xl px-7 py-4 font-semibold text-white" style={cta}>Start free</Link><Link href="/demo" className="rounded-xl bg-white/15 px-7 py-4 font-semibold text-white">See it on sample data</Link></div>
            <p className="mt-5 text-sm text-white/80">Calculated numbers · call analysis · workspace-level security</p>
          </div>
          <div className="rounded-3xl bg-white/95 p-6 text-[#14142b] shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280]">From upload to action</p>
            <ol className="mt-4 space-y-3 text-sm">{["Upload a sales export", "The engine compares this period with the last", "A briefing explains what moved and why it matters", "Next best actions land in your queue"].map((t, i) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={cta}>{i + 1}</span>{t}</li>))}</ol>
            <p className="mt-5 rounded-xl bg-[#eef2ff] p-3 text-xs text-[#4b5563]">Figures are calculated from your data. AI explains them; it does not invent them.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: BLUE }}>The operating model</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight">Eight stages, one memory.</h2>
        <p className="mt-4 max-w-3xl text-lg text-[#4b5563]">Each stage feeds the next. When a prospect says “try me again in September,” that is remembered, scheduled, and put in front of the right person when it matters, with no spreadsheet in between.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{STAGES.map(([t, d], i) => (
          <div key={t} className="rounded-3xl bg-[#f5f7ff] p-6"><span className="font-display text-sm font-extrabold" style={{ color: BLUE }}>0{i + 1}</span><h3 className="mt-2 font-display text-xl font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
      </section>

      <section className="bg-[#14142b] py-20 text-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#a9b8e6]">Reporting rhythm</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight">Briefed as often as you decide.</h2>
          <div className="mt-8 flex flex-wrap gap-3">{CADENCE.map((c) => <span key={c} className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold">{c}</span>)}</div>
          <p className="mt-8 max-w-3xl text-lg text-white/80">Most teams run on a weekly beat: analysis on Monday, a plan for the five days ahead. Pick yours, and each briefing compares the period against the one before it, so a change is a fact and not a feeling.</p>
        </div>
      </section>

      <section id="finds" className="mx-auto max-w-[1200px] px-5 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: BLUE }}>What it looks for</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight">Your sales are already telling you things. Most teams only read the total.</h2>
        <p className="mt-4 max-w-3xl text-lg text-[#4b5563]">CreModelAI reads every row of your sales and pipeline and pulls out the patterns a headline number hides.</p>
        <div className="mt-10 grid overflow-hidden rounded-3xl border border-[#e5e7eb] md:grid-cols-4">{FINDS.map(([t, d], i) => (
          <div key={t} className={`p-6 ${i % 4 !== 3 ? "md:border-r" : ""} ${i < 4 ? "border-b" : ""} border-[#e5e7eb]`}><span className="mb-3 block h-0.5 w-6" style={cta} /><h3 className="font-display text-lg font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
      </section>

      <section id="modules" className="mx-auto max-w-[1200px] space-y-6 px-5 pb-20">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: BLUE }}>Five modules, one record</p>
        <h2 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight">Built to run the revenue motion, not to add another tab.</h2>
        {MODULES.map((f, i) => (
          <article key={f.tag} className="grid overflow-hidden rounded-[2rem] md:grid-cols-2" style={{ background: f.bg }}>
            <div className={`grid min-h-[16rem] place-items-center p-10 ${i % 2 ? "md:order-2" : ""}`}><span className="font-display text-8xl font-extrabold opacity-20" style={{ color: f.fg }}>0{i + 1}</span></div>
            <div className="p-10 md:p-14">
              <p className="text-sm font-semibold tracking-widest" style={{ color: f.fg }}>{f.tag}</p>
              <h3 className="mt-6 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{f.title}</h3>
              <p className="mt-5 text-lg leading-relaxed text-[#374151]">{f.body}</p>
              <Link href={f.href} className="mt-6 inline-flex items-center gap-2 font-semibold" style={{ color: BLUE }}>{f.cta} <ArrowRight size={20} className="rounded-full border-2 p-0.5" style={{ borderColor: BLUE }} /></Link>
            </div>
          </article>))}
      </section>

      <section className="bg-[#f5f7ff] py-20">
        <div className="mx-auto max-w-[1200px] px-5">
          <h2 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight">Before and after CreModelAI</h2>
          <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="grid grid-cols-2 bg-[#14142b] px-6 py-4 text-sm font-bold uppercase tracking-wider text-white"><span>Today</span><span>With CreModelAI</span></div>
            {COMPARE.map(([a, b]) => (<div key={a} className="grid grid-cols-2 gap-6 border-t border-[#e5e7eb] px-6 py-5 text-sm md:text-base"><span className="text-[#6b7280]">{a}</span><span className="flex gap-2 font-semibold"><Check size={18} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{b}</span></div>))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-5 py-20">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">From export to action in four steps</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-4">{STEPS.map(([t, d], i) => (<li key={t} className="rounded-3xl border border-[#e5e7eb] p-6"><span className="font-display text-4xl font-extrabold" style={{ color: BLUE }}>{i + 1}</span><h3 className="mt-3 font-display text-xl font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></li>))}</ol>
      </section>

      <section className="bg-[#f5f7ff] py-20">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: BLUE }}>What you get back</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight">Not a dashboard to decode. A plan you can act on.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{DELIVERABLES.map(([t, s, items]) => (
            <div key={t} className="rounded-3xl bg-white p-8 shadow-sm"><h3 className="font-display text-2xl font-extrabold">{t}</h3><p className="mt-1 text-[#6b7280]">{s}</p><ul className="mt-5 space-y-3 text-sm">{items.map((x) => <li key={x} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{x}</li>)}</ul></div>))}</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-20 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: BLUE }}>Ask in plain language</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Ask it the way you would ask a colleague.</h2>
          <p className="mt-4 text-lg text-[#4b5563]">Every answer comes back with the figures it was built from, and says so when your data cannot answer the question.</p>
          <Link href="/signup" className="mt-6 inline-flex items-center gap-2 font-semibold" style={{ color: BLUE }}>Try it on your data <ArrowRight size={20} className="rounded-full border-2 p-0.5" style={{ borderColor: BLUE }} /></Link>
        </div>
        <div className="rounded-3xl bg-[#f5f7ff] p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#6b7280]">Illustrative example</p>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm text-white" style={cta}>Which customers are buying less than last month?</p>
          <div className="mt-3 max-w-[90%] rounded-2xl bg-white p-4 text-sm shadow-sm"><p>Three accounts are down more than 20% on the previous period. The largest drop is one account that moved from your core plan to nothing this month.</p><p className="mt-2 text-xs text-[#6b7280]">Numbers used: previous vs current revenue per customer, share of total.</p></div>
        </div>
      </section>

      <section className="bg-[#14142b] py-20 text-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#a9b8e6]">Built for teams that cannot get this wrong</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight">Governed by design, not bolted on afterwards.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">{SECURITY.map(([t, d]) => (<div key={t} className="rounded-3xl bg-white/10 p-6"><h3 className="font-display text-lg font-extrabold">{t}</h3><p className="mt-2 text-sm text-white/75">{d}</p></div>))}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20">
        <h2 className="font-display text-4xl font-extrabold tracking-tight">Who it is for</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">{ROLES.map(([t, d]) => (<div key={t} className="rounded-3xl border border-[#e5e7eb] p-6"><h3 className="font-display text-xl font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-[1200px] rounded-[2rem] bg-[#f5f7ff] p-10 md:p-16">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: BLUE }}>Your record</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight">Nothing about your pipeline gets lost.</h2>
          <p className="mt-4 max-w-3xl text-lg text-[#4b5563]">Briefings, follow-ups, call analyses and actions are saved run after run and visible to your whole team, so context survives holidays, handovers and a busy quarter.</p>
          <Link href="/signup" className="mt-8 inline-block rounded-xl px-7 py-4 font-semibold text-white" style={cta}>Start free</Link>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1000px] px-5 pb-20">
        <h2 className="text-center font-display text-4xl font-extrabold tracking-tight">Simple pricing</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(["professional", "enterprise"] as const).map((k) => { const p = PLANS[k]; return (
            <div key={k} className="rounded-[2rem] border border-[#e5e7eb] p-8" style={k === "professional" ? { borderColor: BLUE, borderWidth: 2 } : undefined}>
              <h3 className="font-display text-2xl font-extrabold">{p.name}</h3><p className="text-sm text-[#6b7280]">{p.blurb}</p>
              <p className="num my-4 font-display text-5xl font-extrabold">${p.priceMonthly}<span className="text-base font-medium text-[#6b7280]">/month</span></p>
              <ul className="mb-6 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{f}</li>)}</ul>
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
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Minimum input. Maximum action.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">Upload your sales and get your first briefing and a queue of next best actions back.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="rounded-xl px-8 py-4 font-semibold text-white" style={cta}>Start free</Link><a href="#pricing" className="rounded-xl bg-white/15 px-8 py-4 font-semibold text-white">See pricing</a></div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-[#6b7280]">
        <Logo /><p>© {new Date().getFullYear()} CreModelAI. Insights are based on your own data and are not guarantees of results.</p>
      </footer>
    </div>
  );
}
