import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cremodelai.pro"),
  title: { default: "CreModelAI — The AI revenue platform for sales teams", template: "%s · CreModelAI" },
  description: "Turn your sales data, pipeline and calls into one briefing: what changed, what is slipping and what your team should do next.",
  openGraph: { title: "CreModelAI", description: "The AI revenue platform for sales teams", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
