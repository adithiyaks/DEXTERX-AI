import type { Metadata } from "next";
import { Inter, Roboto_Mono, Geist } from "next/font/google";
import { Activity } from "lucide-react";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEXTERX AI | Forensic Triage",
  description: "AI-Powered Forensic Triage & Postmortem Intelligence System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "dark", inter.variable, robotoMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 selection:bg-cyan-500/30 selection:text-cyan-50">
        <header className="sticky top-0 z-50 flex items-center h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6">
          <div className="flex items-center gap-2 text-red-400">
            <Activity className="h-5 w-5" />
            <span className="font-semibold tracking-wider text-sm">
              DEXTERX AI <span className="text-slate-500 font-normal">| FORENSIC TRIAGE</span>
            </span>
          </div>
        </header>
        <main className="flex-1 flex overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
