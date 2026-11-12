import type { SaleRow } from "./analytics";

/** DEMONSTRATION DATA ONLY: a made-up business, generated deterministically. Always labelled as sample in the UI. */
export function sampleSales(): SaleRow[] {
  const customers = [
    { name: "Northwind Foods", region: "North", rep: "Dana", product: "Core Plan", base: 5200, trend: -0.09 },
    { name: "Harbor Logistics", region: "South", rep: "Eli", product: "Core Plan", base: 4100, trend: 0.07 },
    { name: "Bluebird Clinics", region: "East", rep: "Dana", product: "Analytics Add-on", base: 2600, trend: 0.12 },
    { name: "Summit Retail", region: "North", rep: "Mara", product: "Core Plan", base: 3800, trend: 0.0 },
    { name: "Orchard Schools", region: "West", rep: "Eli", product: "Training", base: 1500, trend: 0.03 },
    { name: "Granite Works", region: "South", rep: "Mara", product: "Analytics Add-on", base: 3300, trend: -0.04 },
    { name: "Lumen Studios", region: "East", rep: "Dana", product: "Training", base: 1200, trend: 0.15 },
  ];
  const rows: SaleRow[] = [];
  const months = 9; // Feb → Oct 2026
  for (let m = 0; m < months; m++) {
    customers.forEach((c, i) => {
      const wobble = 1 + ((((m * 7 + i * 13) % 11) - 5) / 100);
      const amount = Math.round(c.base * (1 + c.trend * m) * wobble);
      const month = String(2 + m).padStart(2, "0");
      rows.push({ date: `2026-${month}-${String(5 + ((i * 3) % 20)).padStart(2, "0")}`, customer: c.name, product: c.product, region: c.region, rep: c.rep, amount });
    });
  }
  return rows;
}
