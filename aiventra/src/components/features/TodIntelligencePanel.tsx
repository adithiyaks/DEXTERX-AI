"use client";

import { motion } from "framer-motion";
import { AlertOctagon, Clock, Activity, ShieldAlert, Ban } from "lucide-react";

export interface TodEstimation {
  status: "Calculated" | "Skipped";
  estimated_hours_elapsed: number;
  estimated_window: string;
  anomaly_score: number;
  risk_level: "Low" | "Medium" | "High" | "CRITICAL";
  investigative_flags: string[];
  confidence_score: number;
}

interface Props {
  data: TodEstimation;
}

export function TodIntelligencePanel({ data }: Props) {
  // If skipped, render a minimal panel
  if (data.status === "Skipped") {
    return (
      <div className="bg-zinc-900/50 border border-slate-800 rounded-sm p-6 flex flex-col items-center justify-center text-center h-full">
        <Ban className="h-8 w-8 text-slate-600 mb-3" />
        <h3 className="text-slate-400 font-semibold tracking-widest uppercase text-xs mb-1">
          Time of Death Computation Skipped
        </h3>
        <p className="text-slate-500 font-mono text-xs">
          Insufficient temporal baseline data in unstructured report.
        </p>
      </div>
    );
  }

  // Dynamic Theming Logic
  const isHighRisk = data.risk_level === "CRITICAL" || data.risk_level === "High";
  const isMediumRisk = data.risk_level === "Medium";
  
  const theme = {
    border: isHighRisk ? "border-red-500/50" : isMediumRisk ? "border-amber-500/50" : "border-cyan-500/50",
    text: isHighRisk ? "text-red-500" : isMediumRisk ? "text-amber-500" : "text-cyan-500",
    bg: isHighRisk ? "bg-red-950/20" : isMediumRisk ? "bg-amber-950/20" : "bg-cyan-950/20",
    bannerBg: isHighRisk ? "bg-red-950/40 border-red-900/50" : isMediumRisk ? "bg-amber-950/40 border-amber-900/50" : "bg-cyan-950/40 border-cyan-900/50",
    icon: isHighRisk ? ShieldAlert : isMediumRisk ? AlertOctagon : Activity,
  };

  const IconComponent = theme.icon;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const flagVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className={`relative bg-zinc-900/50 border ${theme.border} rounded-sm p-6 flex flex-col h-full overflow-hidden`}>
      {/* Subtle Background Glow for High Risk */}
      {isHighRisk && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-red-600/10 blur-[50px] pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col md:flex-row gap-8 mb-6">
        {/* Left Col: Anomaly Score */}
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className={`h-4 w-4 ${theme.text}`} />
            <h3 className={`text-xs font-semibold uppercase tracking-widest ${theme.text} opacity-80`}>
              Anomaly Score
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl md:text-7xl font-mono font-bold tracking-tighter ${theme.text}`}>
              {data.anomaly_score}
            </span>
            <span className="text-slate-500 font-mono text-sm">/ 100</span>
          </div>
          <div className={`mt-2 px-2 py-0.5 rounded-sm border ${theme.border} ${theme.bg}`}>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${theme.text}`}>
              Risk: {data.risk_level}
            </span>
          </div>
        </div>

        {/* Right Col: Timeline & Estimated Window */}
        <div className="flex-1 flex flex-col justify-center border-l border-slate-800 pl-8">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Estimated TOD Window
            </h3>
          </div>
          <div className="text-2xl md:text-3xl font-mono text-slate-200 mb-1">
            {data.estimated_window}
          </div>
          <p className="text-slate-500 font-mono text-xs">
            Base calculated: {data.estimated_hours_elapsed} hrs ago (Confidence: {data.confidence_score}%)
          </p>
        </div>
      </div>

      {/* Investigative Flags */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-800 pb-2">
          Investigative Flags & Contradictions
        </h3>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
        >
          {data.investigative_flags.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs p-3">
              <Activity className="h-3 w-3" />
              <span>No major anomalies detected in timeline.</span>
            </div>
          ) : (
            data.investigative_flags.map((flag, idx) => (
              <motion.div
                key={idx}
                variants={flagVariants}
                className={`flex items-start gap-3 p-4 rounded-sm border ${theme.bannerBg} ${data.risk_level === "CRITICAL" ? "animate-[pulse_3s_ease-in-out_infinite]" : ""}`}
              >
                <AlertOctagon className={`h-4 w-4 shrink-0 mt-0.5 ${theme.text}`} />
                <span className="text-slate-200 font-mono text-sm leading-relaxed">
                  {flag}
                </span>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
