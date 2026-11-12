import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Logo } from "@/components/Logo";
import RoiCalculator from "@/components/RoiCalculator";
import { PLANS } from "@/lib/plans";

const BLUE = "#2563eb";
const cta = { background: BLUE } as const;
const label = "text-sm font-semibold uppercase tracking-widest";
const h2 = "mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl";
const Arrow = () => <ArrowRight size={20} className="rounded-full border-2 p-0.5" style={{ borderColor: BLUE }} />;

const PAINS: [string, string][] = [
  ["“I thought you were following up.”", "Two people each assume the other has the prospect. Nobody does, and the deal goes cold."],
  ["The quarterly scramble", "Every review starts with a day of pulling exports, fixing columns and arguing about whose number is right."],
  ["The customer who quietly left", "Orders shrank for three months. Nobody noticed until the account was already gone."],
  ["Notes in six places", "Call notes in a doc, promises in an inbox, next steps in someone's head. The context leaves with the person."],
  ["A healthy total hiding a problem", "Revenue looks fine overall while one region, rep or product falls off a cliff underneath it."],
  ["Advice that fits any company", "Generic playbooks that ignore what has actually worked in your own sales."],
];
const STAGES: [string, string][] = [
  ["Find", "Learns what your best customers have in common and surfaces more companies like them."],
  ["Prepare", "Gives you the account history and context before you pick up the phone."],
  ["Converse", "Turns every call into structured notes: what was asked, promised and left open."],
  ["Understand", "Reads buyer intent and objections so you respond to what they meant."],
  ["Follow up", "Remembers who to chase, when, and why, then drafts the message."],
  ["Close", "Keeps the next step visible on every deal until it is won or lost."],
  ["Retain", "Spots customers buying less before they say a word."],
  ["Grow", "Points at the products, segments and accounts with the most room left."],
];
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
  { tag: "BRIEFINGS", title: "A written read of your business, on your schedule", body: "Pick a rhythm and get a plain-English briefing: what changed, what is working, what is at risk, and what to do. The numbers come from a calculation engine, so the story always matches your data.", cta: "See it on sample data", href: "/demo", bg: "linear-gradient(135deg,#f1e8ff,#dcd0fb)", fg: "#4c1d95", points: ["Seven reporting rhythms, daily to annual", "Compared against the previous period", "Saved and shared with the team"] },
  { tag: "NEXT BEST ACTIONS", title: "Insight that ends in a task, not a chart", body: "Every finding resolves to a named account and a reason. Add it to the queue, work it, mark it done. Nothing sits in a dashboard waiting to be interpreted.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#e3edff,#c9dafc)", fg: "#1e3a8a", points: ["Priority and reason on every item", "Notes and completion history", "One click from briefing to queue"] },
  { tag: "FOLLOW-UPS", title: "Nothing slips because someone forgot", body: "Overdue, due today, gone quiet for two weeks. Each deal that needs attention shows why and gets a drafted message you can edit and send.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#e2f6ee,#c3ecd9)", fg: "#065f46", points: ["Triage calculated from your dates", "Drafts grounded in your notes", "Mark contacted and reschedule"] },
  { tag: "CONVERSATIONS", title: "Every call, broken down", body: "Paste a transcript and get the summary, buyer intent, objections with suggested responses, commitments made and the next steps, ready to act on.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#ffeedd,#fddcb8)", fg: "#9a3412", points: ["Objections with suggested replies", "Commitments and deadlines pulled out", "Linked to the deal"] },
  { tag: "LEAD FINDER", title: "Look for more of the customers who already buy", body: "Your ideal customer is learned from your own sales: who spends most, what they buy, where they are. Candidates you add are scored against that profile, with the reasoning shown.", cta: "Start free", href: "/signup", bg: "linear-gradient(135deg,#fde4ef,#f9c7dc)", fg: "#9d174d", points: ["Profile derived from your top customers", "Scores with the reasoning shown", "Only uses what you enter, never invented"] },
];
const CAPS: [string, string][] = [
  ["Spreadsheet import with review", "Map columns, preview every row, see rejects and duplicates before anything is saved."],
  ["Deterministic analytics", "Revenue, change, share and risk are calculated in code, so they are repeatable and checkable."],
  ["Period-over-period comparison", "Every briefing sets the period against the one before it, at the cadence you choose."],
  ["Segment breakdowns", "Customer, product, region and rep views in one place."],
  ["Pipeline with stages", "Find, prepare, converse, follow up, close, won and lost with owners and values."],
  ["Follow-up triage", "Overdue, due today and gone-quiet deals sorted for you."],
  ["Call transcript analysis", "Intent, objections, commitments and risks from any pasted transcript."],
  ["Plain-language questions", "Ask your data a question and see the figures behind the answer."],
  ["Action queue with history", "Priorities, notes and completion times for every recommendation."],
  ["Team roles", "Owner, admin and working roles, plus view-only access."],
  ["Audit trail", "Imports and key changes are recorded against the user who made them."],
  ["Works without the AI", "If the AI service is down, your data and calculated reports still work."],
];
const RHYTHM = ["Daily", "Weekly", "Biweekly", "Monthly", "Quarterly", "Biannual", "Annual"];
const STEPS: [string, string][] = [
  ["Upload your sales", "Drop in a CSV or Excel export. Match the columns, preview every row, and confirm."],
  ["Add your pipeline", "Enter the deals you are working with stages and follow-up dates, or add them as you go."],
  ["Get the briefing", "Choose a cadence. The engine calculates the facts; the AI writes the read and the plan."],
  ["Work the queue", "Clear next best actions and send the drafted follow-ups. The next briefing reflects what you did."],
];
const DELIVERABLES: [string, string, string[]][] = [
  ["The report", "A plain-English read of the period.", ["How products, customers, regions and reps performed", "What rose, what fell, and by how much", "Anything unusual worth checking"]],
  ["The strategy", "Built from your own results.", ["Where to do more of what already works", "Which accounts and products to push", "The revenue reason behind each idea"]],
  ["The actions", "A queue, not a list of advice.", ["Named accounts and priorities", "The reason attached to every item", "One click to mark it done"]],
];
const PLAYBOOKS: [string, string, string[]][] = [
  ["The Monday pipeline review", "Replace the slide-building with a briefing everyone reads before the meeting.", ["Generate a weekly briefing", "Walk the at-risk list together", "Assign the top actions in the room"]],
  ["Quarter-end close-out", "See where the quarter really stands against the one before.", ["Run a quarterly briefing", "Check concentration and declining accounts", "Decide where the final push goes"]],
  ["Account handover", "When someone leaves or a territory changes, the context stays.", ["Deal notes and call analyses are saved", "Follow-up history is visible", "The new owner starts informed"]],
  ["Churn watch", "Catch the slow fade before the cancellation email.", ["Declining customers flagged each period", "Revenue at risk quantified", "Follow-up drafted for each"]],
];
const ROLES: [string, string][] = [
  ["Founders", "See the whole business in one briefing without building the report yourself."],
  ["Sales leaders", "Know which reps, regions and accounts need you this week."],
  ["Account managers", "Catch the customer who is quietly buying less and get a follow-up drafted."],
  ["Operators and analysts", "Replace the manual monthly pull with a repeatable, consistent report."],
];
const NOW = ["CSV and Excel sales imports", "Pasted call transcripts", "Manual pipeline entry", "Team workspaces with roles"];
const SOON = ["Live CRM connections", "Audio upload and transcription", "PDF extraction", "Automatic lead discovery"];
const SECURITY: [string, string][] = [
  ["Isolated at the database", "Row-level security scopes every query to your organization, so access is enforced where the data lives, not only in the interface."],
  ["Role-based access", "Owners and admins manage the workspace. Others can work or just view, with permissions that match the job."],
  ["Private file storage", "Uploaded files are stored privately under your organization and are not publicly reachable."],
  ["Server-side AI", "AI keys never reach the browser, and requests are rate limited and recorded."],
  ["Audit trail", "Imports and important actions are logged with who did them and when."],
  ["Your data stays yours", "Files, calls and notes run your workspace. They are not used to train shared models."],
];
const COMPARE: [string, string][] = [
  ["A spreadsheet for sales, another for the pipeline", "One workspace that holds sales, deals, calls and actions together"],
  ["Monthly review built by hand the night before", "A briefing generated on the rhythm you choose"],
  ["Follow-ups living in someone's inbox", "A shared queue with dates, reasons and drafts"],
  ["Call notes nobody reads twice", "Structured objections, intent and commitments on every deal"],
  ["Gut feel about which customers are slipping", "Declining accounts flagged against the previous period"],
  ["Advice that could apply to any company", "Suggestions built from your own wins and your own numbers"],
];
const MATRIX: [string, boolean, boolean][] = [
  ["Sales data import (CSV, Excel)", true, true], ["Revenue analytics and period comparison", true, true], ["Briefings on any cadence", true, true],
  ["Next best actions queue", true, true], ["Pipeline and follow-up drafting", true, true], ["Ask in plain language", true, true],
  ["Call transcript analysis", false, true], ["Lead Finder with scoring", false, true], ["Team roles and permissions", false, true], ["Audit trail", false, true],
];
const FAQ: [string, string][] = [
  ["Does the AI make up the numbers?", "No. Revenue, changes, shares and risk are calculated by a deterministic engine from your data. The AI reads those results and writes about them, and it is told not to invent customers, amounts or causes."],
  ["What data do I need to start?", "A sales export with a date, a customer and an amount per row. Product, region and rep make the findings richer. CSV and XLSX are supported; PDF is coming soon."],
  ["What happens if a row in my file is wrong?", "You see it. Rejected rows and duplicates are listed with the reason, and only clean rows are imported after you confirm."],
  ["What if the AI service is down?", "Your data, calculated figures and saved briefings keep working. A briefing can still be generated with its calculated findings and a narrative added later."],
  ["How long does setup take?", "Most of the time is exporting your data. Creating a workspace, uploading a file and generating a first briefing are a few steps in the app."],
  ["Can my whole team use it?", "Yes. Add teammates with roles, from admin to view-only. Each workspace is separate from every other."],
  ["Does it connect to my CRM?", "Not yet. Today you upload exports and manage deals inside the workspace. Live CRM connections are on the roadmap, not live."],
  ["Does it transcribe call audio?", "Not yet. You paste a transcript, and the analysis runs on that. Audio upload is coming soon."],
  ["Who can see my data?", "Only members of your workspace. Access is enforced by row-level security in the database, and files are stored privately."],
  ["Is my data used to train AI models?", "No. Your uploads, calls and notes are used to run your workspace and nothing else."],
  ["Will it tell me exactly what will close?", "No. It shows what your data says and suggests where to act. Results depend on your market and your team, and nothing here is a guarantee."],
  ["How do I pay and cancel?", "Choose a plan in Usage & Billing. Payment happens on a secure external page and your plan activates once payment is confirmed."],
];
const FOOT: [string, [string, string][]][] = [
  ["Product", [["What it finds", "#finds"], ["Modules", "#modules"], ["Capabilities", "#capabilities"], ["Pricing", "#pricing"], ["Sample-data demo", "/demo"]]],
  ["Solutions", [["Pipeline reviews", "#playbooks"], ["Churn watch", "#playbooks"], ["Account handover", "#playbooks"], ["Quarter-end", "#playbooks"]]],
  ["Trust", [["Security", "#security"], ["Data we support", "#data"], ["FAQ", "#faq"]]],
  ["Account", [["Log in", "/login"], ["Create account", "/signup"], ["Reset password", "/reset"]]],
];

export default function Home() {
  return (
    <div className="bg-white text-[#14142b]">
      <div className="flex items-center justify-between bg-white px-5 text-sm md:px-16">
        <div className="flex gap-8"><span className="border-b-[3px] py-3 font-semibold" style={{ borderColor: BLUE }}>For Sales Teams</span><span className="py-3 text-[#6b7280]">For Founders</span></div>
        <span className="text-[#6b7280]">EN</span>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg,#5b6aa6 0%,#7f8fc6 45%,#a9b8e6 100%)" }}>
        <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5">
          <Link href="/" className="text-white"><span className="font-display text-2xl font-extrabold tracking-tight">CreModel<span className="opacity-80">AI</span></span></Link>
          <nav className="hidden gap-7 text-sm font-semibold lg:flex" aria-label="Site"><a href="#problem">The problem</a><a href="#finds">What it finds</a><a href="#modules">Modules</a><a href="#how">How it works</a><a href="#security">Security</a><a href="#pricing">Pricing</a></nav>
          <div className="flex items-center gap-4 text-sm font-semibold"><Link href="/login">Log in</Link><Link href="/signup" className="rounded-xl px-5 py-3 text-white" style={cta}>Get started for free</Link></div>
        </header>
        <div className="mx-auto max-w-4xl px-5 pb-28 pt-14 text-center md:pt-20">
          <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[#86efac]" />The AI revenue platform for sales teams</p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">The AI that stops deals <span className="text-[#14142b]">slipping through</span> a messy pipeline.</h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">CreModelAI reads your sales, deals and calls, spots the customers going quiet, and hands your team a clear list of what to do next. Every week, without the spreadsheet.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/signup" className="rounded-xl px-8 py-4 font-semibold text-white shadow-lg" style={cta}>Get your first briefing free</Link><Link href="/demo" className="rounded-xl bg-white/15 px-8 py-4 font-semibold text-white">See it on sample data</Link></div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/90">{["Upload a CSV or Excel export", "First briefing in minutes", "Every number calculated, never guessed"].map((t) => <li key={t} className="flex items-center gap-2"><Check size={16} />{t}</li>)}</ul>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-8 text-center sm:grid-cols-2 md:grid-cols-4">
          {[["Calculated, not guessed", "Deterministic analytics engine"], ["Isolated per workspace", "Row-level database security"], ["Role-based access", "Owner, admin, member, view-only"], ["Works without the AI", "Your reports never go dark"]].map(([a, b]) => (
            <div key={a}><p className="font-display font-extrabold">{a}</p><p className="mt-1 text-sm text-[#6b7280]">{b}</p></div>))}
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="mx-auto max-w-[1200px] px-5 py-24">
        <p className={label} style={{ color: BLUE }}>The problem</p>
        <h2 className={h2}>Deals are rarely lost to a competitor. They are lost to disorganization.</h2>
        <p className="mt-5 max-w-3xl text-lg text-[#4b5563]">A prospect goes quiet. A promise is forgotten. A good customer drifts away. None of it shows up in the total, so none of it gets fixed until it is expensive.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">{PAINS.map(([t, d]) => (
          <div key={t} className="rounded-3xl border border-[#e5e7eb] bg-[#fafbff] p-7"><h3 className="font-display text-xl font-extrabold">{t}</h3><p className="mt-3 text-[#4b5563]">{d}</p></div>))}</div>
        <div className="mt-12 rounded-[2rem] p-10 text-center md:p-14" style={{ background: "linear-gradient(135deg,#f1e8ff,#dcd0fb)" }}>
          <p className="mx-auto max-w-3xl font-display text-2xl font-extrabold leading-snug tracking-tight md:text-3xl">The information to prevent this is already in your sales data, your pipeline and your calls. It just is not being read.</p>
        </div>
      </section>

      {/* COST CALCULATOR */}
      <section className="px-5 pb-24"><div className="mx-auto max-w-[1200px]"><RoiCalculator /></div></section>

      {/* BEFORE / AFTER */}
      <section className="bg-[#f5f7ff] py-24">
        <div className="mx-auto max-w-[1200px] px-5">
          <h2 className={h2}>Before and after CreModelAI</h2>
          <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="grid grid-cols-2 bg-[#14142b] px-6 py-4 text-sm font-bold uppercase tracking-wider text-white"><span>Today</span><span>With CreModelAI</span></div>
            {COMPARE.map(([a, b]) => (<div key={a} className="grid grid-cols-2 gap-6 border-t border-[#e5e7eb] px-6 py-5 text-sm md:text-base"><span className="text-[#6b7280]">{a}</span><span className="flex gap-2 font-semibold"><Check size={18} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{b}</span></div>))}
          </div>
        </div>
      </section>

      {/* OPERATING MODEL */}
      <section className="mx-auto max-w-[1200px] px-5 py-24">
        <p className={label} style={{ color: BLUE }}>The operating model</p>
        <h2 className={h2}>Eight stages, one memory.</h2>
        <p className="mt-4 max-w-3xl text-lg text-[#4b5563]">Each stage feeds the next. When a prospect says “try me again in September,” that is remembered, scheduled, and put in front of the right person when it matters, with no spreadsheet in between.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{STAGES.map(([t, d], i) => (
          <div key={t} className="rounded-3xl bg-[#f5f7ff] p-6"><span className="font-display text-sm font-extrabold" style={{ color: BLUE }}>0{i + 1}</span><h3 className="mt-2 font-display text-xl font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
      </section>

      {/* FINDS */}
      <section id="finds" className="mx-auto max-w-[1200px] px-5 pb-24">
        <p className={label} style={{ color: BLUE }}>What it looks for</p>
        <h2 className={h2}>Your sales are already talking. Most teams only hear the total.</h2>
        <p className="mt-4 max-w-3xl text-lg text-[#4b5563]">CreModelAI reads every row of your sales and pipeline and pulls out the patterns a headline number hides.</p>
        <div className="mt-10 grid overflow-hidden rounded-3xl border border-[#e5e7eb] md:grid-cols-4">{FINDS.map(([t, d], i) => (
          <div key={t} className={`p-6 ${i % 4 !== 3 ? "md:border-r" : ""} ${i < 4 ? "md:border-b" : ""} border-b border-[#e5e7eb] md:last:border-b-0`}><span className="mb-3 block h-0.5 w-6" style={cta} /><h3 className="font-display text-lg font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
      </section>

      {/* MODULES */}
      <section id="modules" className="mx-auto max-w-[1200px] space-y-6 px-5 pb-24">
        <p className={label} style={{ color: BLUE }}>Five modules, one record</p>
        <h2 className={h2}>Built to run the revenue motion, not to add another tab.</h2>
        {MODULES.map((f, i) => (
          <article key={f.tag} className="grid overflow-hidden rounded-[2rem] md:grid-cols-2" style={{ background: f.bg }}>
            <div className={`flex flex-col justify-center gap-3 p-10 md:p-14 ${i % 2 ? "md:order-2" : ""}`}>
              <span className="font-display text-7xl font-extrabold opacity-20" style={{ color: f.fg }}>0{i + 1}</span>
              <ul className="space-y-3">{f.points.map((p) => <li key={p} className="flex gap-2 font-semibold" style={{ color: f.fg }}><Check size={20} className="mt-0.5 shrink-0" />{p}</li>)}</ul>
            </div>
            <div className="p-10 md:p-14">
              <p className="text-sm font-semibold tracking-widest" style={{ color: f.fg }}>{f.tag}</p>
              <h3 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{f.title}</h3>
              <p className="mt-5 text-lg leading-relaxed text-[#374151]">{f.body}</p>
              <Link href={f.href} className="mt-6 inline-flex items-center gap-2 font-semibold" style={{ color: BLUE }}>{f.cta} <Arrow /></Link>
            </div>
          </article>))}
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="bg-[#f5f7ff] py-24">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className={label} style={{ color: BLUE }}>Platform capabilities</p>
          <h2 className={h2}>Everything a revenue team needs to stay on top of the pipeline.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{CAPS.map(([t, d]) => (<div key={t} className="rounded-3xl bg-white p-6 shadow-sm"><Check size={20} style={{ color: BLUE }} /><h3 className="mt-3 font-display text-lg font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
        </div>
      </section>

      {/* RHYTHM */}
      <section className="bg-[#14142b] py-24 text-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className={`${label} text-[#a9b8e6]`}>Reporting rhythm</p>
          <h2 className={h2}>Briefed as often as you decide.</h2>
          <div className="mt-8 flex flex-wrap gap-3">{RHYTHM.map((c) => <span key={c} className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold">{c}</span>)}</div>
          <p className="mt-8 max-w-3xl text-lg text-white/80">Most teams run on a weekly beat: analysis on Monday, a plan for the five days ahead. Pick yours, and each briefing compares the period against the one before it, so a change is a fact and not a feeling.</p>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 py-24">
        <p className={label} style={{ color: BLUE }}>How it works</p>
        <h2 className={h2}>From export to action in four steps.</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-4">{STEPS.map(([t, d], i) => (<li key={t} className="rounded-3xl border border-[#e5e7eb] p-6"><span className="font-display text-4xl font-extrabold" style={{ color: BLUE }}>{i + 1}</span><h3 className="mt-3 font-display text-xl font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></li>))}</ol>
        <p className="mt-6 flex items-center gap-2 text-[#4b5563]"><Clock size={18} style={{ color: BLUE }} />No implementation project. If you have a sales export, you can start today.</p>
      </section>

      {/* DELIVERABLES */}
      <section className="bg-[#f5f7ff] py-24">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className={label} style={{ color: BLUE }}>What you get back</p>
          <h2 className={h2}>Not a dashboard to decode. A plan you can act on.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{DELIVERABLES.map(([t, s, items]) => (
            <div key={t} className="rounded-3xl bg-white p-8 shadow-sm"><h3 className="font-display text-2xl font-extrabold">{t}</h3><p className="mt-1 text-[#6b7280]">{s}</p><ul className="mt-5 space-y-3 text-sm">{items.map((x) => <li key={x} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{x}</li>)}</ul></div>))}</div>
        </div>
      </section>

      {/* PLAYBOOKS */}
      <section id="playbooks" className="mx-auto max-w-[1200px] px-5 py-24">
        <p className={label} style={{ color: BLUE }}>Playbooks</p>
        <h2 className={h2}>Fits the way revenue teams already work.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">{PLAYBOOKS.map(([t, d, items]) => (
          <div key={t} className="rounded-3xl border border-[#e5e7eb] p-8"><h3 className="font-display text-2xl font-extrabold">{t}</h3><p className="mt-2 text-[#4b5563]">{d}</p><ol className="mt-5 space-y-2 text-sm">{items.map((x, i) => <li key={x} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={cta}>{i + 1}</span>{x}</li>)}</ol></div>))}</div>
      </section>

      {/* ROLES */}
      <section className="bg-[#f5f7ff] py-24">
        <div className="mx-auto max-w-[1200px] px-5">
          <h2 className={h2}>Who it is for</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">{ROLES.map(([t, d]) => (<div key={t} className="rounded-3xl bg-white p-6 shadow-sm"><h3 className="font-display text-xl font-extrabold">{t}</h3><p className="mt-2 text-sm text-[#4b5563]">{d}</p></div>))}</div>
        </div>
      </section>

      {/* DATA */}
      <section id="data" className="mx-auto max-w-[1200px] px-5 py-24">
        <p className={label} style={{ color: BLUE }}>Your data</p>
        <h2 className={h2}>Plain about what works today and what is coming.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border-2 p-8" style={{ borderColor: BLUE }}><h3 className="font-display text-xl font-extrabold">Available now</h3><ul className="mt-4 space-y-3">{NOW.map((x) => <li key={x} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{x}</li>)}</ul></div>
          <div className="rounded-3xl border border-[#e5e7eb] p-8"><h3 className="font-display text-xl font-extrabold">Coming soon</h3><ul className="mt-4 space-y-3 text-[#4b5563]">{SOON.map((x) => <li key={x} className="flex gap-2"><Clock size={18} className="mt-0.5 shrink-0" />{x}</li>)}</ul></div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="bg-[#14142b] py-24 text-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className={`${label} text-[#a9b8e6]`}>Built for teams that cannot get this wrong</p>
          <h2 className={h2}>Governed by design, not bolted on afterwards.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{SECURITY.map(([t, d]) => (<div key={t} className="rounded-3xl bg-white/10 p-6"><h3 className="font-display text-lg font-extrabold">{t}</h3><p className="mt-2 text-sm text-white/75">{d}</p></div>))}</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-[1000px] px-5 py-24">
        <h2 className="text-center font-display text-4xl font-extrabold tracking-tight md:text-5xl">Simple pricing</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[#4b5563]">Two plans. Start free, then pick the one that fits how your team works.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(["professional", "enterprise"] as const).map((k) => { const p = PLANS[k]; return (
            <div key={k} className="rounded-[2rem] border border-[#e5e7eb] p-8" style={k === "professional" ? { borderColor: BLUE, borderWidth: 2 } : undefined}>
              <h3 className="font-display text-2xl font-extrabold">{p.name}</h3><p className="text-sm text-[#6b7280]">{p.blurb}</p>
              <p className="num my-4 font-display text-5xl font-extrabold">${p.priceMonthly}<span className="text-base font-medium text-[#6b7280]">/month</span></p>
              <ul className="mb-6 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" style={{ color: BLUE }} />{f}</li>)}</ul>
              <Link href="/signup" className="block rounded-xl py-3 text-center font-semibold text-white" style={cta}>Get started</Link>
            </div>); })}
        </div>
        <div className="mt-10 overflow-hidden rounded-3xl border border-[#e5e7eb]">
          <div className="grid grid-cols-[1fr_6rem_6rem] bg-[#f5f7ff] px-5 py-3 text-sm font-bold"><span>Compare plans</span><span className="text-center">Professional</span><span className="text-center">Enterprise</span></div>
          {MATRIX.map(([t, a, b]) => (<div key={t} className="grid grid-cols-[1fr_6rem_6rem] items-center border-t border-[#e5e7eb] px-5 py-3 text-sm"><span>{t}</span><span className="grid place-items-center">{a ? <Check size={18} style={{ color: BLUE }} aria-label="Included" /> : <span className="text-[#9ca3af]" aria-label="Not included">—</span>}</span><span className="grid place-items-center">{b ? <Check size={18} style={{ color: BLUE }} aria-label="Included" /> : <span className="text-[#9ca3af]">—</span>}</span></div>))}
        </div>
        <p className="mt-4 text-center text-xs text-[#6b7280]">Create an account, then choose your plan in Usage &amp; Billing. Payment is handled on an external secure page.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">{FAQ.map(([q, a]) => (<details key={q} className="rounded-2xl border border-[#e5e7eb] p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-[#4b5563]">{a}</p></details>))}</div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-[1200px] rounded-[2rem] p-12 text-center text-white md:p-20" style={{ background: "linear-gradient(135deg,#5b6aa6,#a9b8e6)" }}>
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">Stop finding out about lost deals after the fact.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">Upload your sales and get your first briefing and a queue of next best actions back.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="rounded-xl px-8 py-4 font-semibold text-white" style={cta}>Start free</Link><a href="#pricing" className="rounded-xl bg-white/15 px-8 py-4 font-semibold text-white">See pricing</a></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7eb] bg-[#fafbff]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div><Logo /><p className="mt-4 max-w-xs text-sm text-[#6b7280]">The AI revenue platform that turns your sales, pipeline and calls into one briefing and a queue of actions.</p></div>
          {FOOT.map(([h, links]) => (<div key={h}><p className="font-display font-extrabold">{h}</p><ul className="mt-3 space-y-2 text-sm text-[#4b5563]">{links.map(([t, href]) => <li key={t}>{href.startsWith("/") ? <Link href={href}>{t}</Link> : <a href={href}>{t}</a>}</li>)}</ul></div>))}
        </div>
        <p className="mx-auto max-w-[1200px] border-t border-[#e5e7eb] px-5 py-6 text-xs text-[#6b7280]">© {new Date().getFullYear()} CreModelAI. Insights are based on your own data and are not guarantees of results.</p>
      </footer>
    </div>
  );
}
