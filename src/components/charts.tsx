"use client";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthRow } from "@/lib/engine/types";
import { money } from "@/lib/format";

const C = { revenue: "#174d38", profit: "#d9a441", cash: "#542536", cost: "#b96848" };

export function RevenueProfitChart({ months, currency }: { months: MonthRow[]; currency: string }) {
  return (
    <div role="img" aria-label="Monthly revenue and operating profit chart" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3d9c6" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => money(v, currency, true)} width={60} />
          <Tooltip formatter={(v) => money(Number(v), currency)} labelFormatter={(l) => `Month ${l}`} />
          <Legend />
          <Bar dataKey="revenue" name="Revenue" fill={C.revenue} />
          <Bar dataKey="operatingProfit" name="Operating profit" fill={C.profit} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashChart({ months, currency }: { months: MonthRow[]; currency: string }) {
  return (
    <div role="img" aria-label="Closing cash balance by month" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3d9c6" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => money(v, currency, true)} width={60} />
          <Tooltip formatter={(v) => money(Number(v), currency)} labelFormatter={(l) => `Month ${l}`} />
          <Legend />
          <ReferenceLine y={0} stroke="#b3372f" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="closingCash" name="Closing cash" stroke={C.cash} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="netCash" name="Net cash movement" stroke={C.cost} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareChart({ data, currency }: { data: { name: string; Revenue: number; "Operating profit": number }[]; currency: string }) {
  return (
    <div role="img" aria-label="Scenario comparison chart" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3d9c6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => money(v, currency, true)} width={60} />
          <Tooltip formatter={(v) => money(Number(v), currency)} />
          <Legend />
          <Bar dataKey="Revenue" fill={C.revenue} />
          <Bar dataKey="Operating profit" fill={C.profit} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
