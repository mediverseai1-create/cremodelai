import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cremodelai.pro"),
  title: { default: "CreModelAI — AI Business Modeling & Financial Intelligence", template: "%s · CreModelAI" },
  description: "Build connected financial models, test pricing, costs and growth scenarios, and understand your funding needs before you commit. Model the business. Test the numbers. Make informed decisions.",
  openGraph: { title: "CreModelAI", description: "AI Business Modeling & Financial Intelligence", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
