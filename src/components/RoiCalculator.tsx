"use client";
import Link from "next/link";
import { useState } from "react";

const BLUE = "#2563eb";
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** A back-of-envelope estimator. Every input is the visitor's own; nothing here is a claim about results. */
export default function RoiCalculator() {
  const [deals, setDeals] = useState(40);
  const [value, setValue] = useState(3000);
  const [slip, setSlip] = useState(10);
  const atStake = deals * 12 * value * (slip / 100);
  const field = "w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-lg font-semibold";
  return (
    <div className="grid gap-8 rounded-[2rem] bg-[#14142b] p-8 text-white md:grid-cols-[1.2fr_1fr] md:p-12">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#a9b8e6]">Do the maths on your own pipeline</p>
        <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">What does a slipped follow-up cost you each year?</h3>
        <p className="mt-3 text-white/70">Enter your own figures. This is a simple estimate of the revenue exposed to deals that go quiet. It is not a forecast, and it is not a promise of what CreModelAI will recover.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-[#14142b]">
          <label className="block text-sm font-semibold text-white">New deals per month<input className={`${field} mt-2`} type="number" min={0} value={deals} onChange={(e) => setDeals(Math.max(0, e.target.valueAsNumber || 0))} /></label>
          <label className="block text-sm font-semibold text-white">Average deal value ($)<input className={`${field} mt-2`} type="number" min={0} value={value} onChange={(e) => setValue(Math.max(0, e.target.valueAsNumber || 0))} /></label>
          <label className="block text-sm font-semibold text-white">Deals that go quiet (%)<input className={`${field} mt-2`} type="number" min={0} max={100} value={slip} onChange={(e) => setSlip(Math.min(100, Math.max(0, e.target.valueAsNumber || 0)))} /></label>
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-3xl bg-white/10 p-8 text-center">
        <p className="text-sm text-white/70">Revenue exposed each year</p>
        <p className="num mt-2 font-display text-5xl font-extrabold">{fmt(atStake)}</p>
        <p className="mt-3 text-sm text-white/60">{deals} deals × 12 months × {fmt(value)} × {slip}%</p>
        <Link href="/signup" className="mt-6 rounded-xl px-6 py-3 font-semibold text-white" style={{ background: BLUE }}>Find out where yours is slipping</Link>
      </div>
    </div>
  );
}
