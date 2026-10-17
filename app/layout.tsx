import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexicore Suite — AI-Powered Law, Tax & Accounting Intelligence",
  description: "Next-generation cloud & desktop operating system for modern legal, CPA, and tax advisory practices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        <div className="ai-ambient-glow" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
