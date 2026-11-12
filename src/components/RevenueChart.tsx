"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact } from "@/lib/format";

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted">No monthly data yet.</p>;
  return (
    <div role="img" aria-label="Monthly revenue" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3d9c6" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={compact} width={56} />
          <Tooltip formatter={(v) => Number(v).toLocaleString()} />
          <Bar dataKey="revenue" name="Revenue" fill="#174d38" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
