import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Activity, Stethoscope, AlertTriangle, CheckCircle2, Scan, Users, Scale, Network } from "lucide-react";
import { TodIntelligencePanel, TodEstimation } from "@/components/features/TodIntelligencePanel";
import { EvidenceGraph } from "@/components/features/EvidenceGraph";

interface AnalysisResult {
  document_category?: "AUTOPSY" | "FIR";
  probable_cause: string;
  injury_patterns: string[];
  medical_observations: string[];
  entities_involved?: string[];
  legal_evidence?: string[];
  tod_estimation: TodEstimation;
  confidence_score: number;
}

export function AnalysisDashboard({ data }: { data: AnalysisResult }) {
  const [showGraph, setShowGraph] = useState(false);
  // Determine color based on confidence
  const getConfidenceColor = (score: number) => {
    if (score >= 85) return "text-cyan-400 bg-cyan-950/30 border-cyan-500/50";
    if (score >= 60) return "text-yellow-400 bg-yellow-950/30 border-yellow-500/50";
    return "text-red-400 bg-red-950/30 border-red-500/50";
  };

  const confidenceTheme = getConfidenceColor(data.confidence_score);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full gap-4"
    >
      {/* Top Row: Cause of Death & Confidence Score */}
      <div className="flex gap-4">
        {/* Probable Cause Panel */}
        <motion.div variants={itemVariants} className="flex-1 bg-slate-900/40 border border-slate-800 rounded-sm p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 to-transparent"></div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-cyan-500" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Probable Cause
            </h3>
          </div>
          <p className="text-slate-100 font-mono text-lg md:text-xl leading-relaxed">
            {data.probable_cause}
          </p>
        </motion.div>

        {/* Confidence Score Panel */}
        <motion.div variants={itemVariants} className={`w-48 border rounded-sm p-5 flex flex-col justify-between ${confidenceTheme}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest opacity-80">
              Confidence
            </h3>
            <Crosshair className="h-4 w-4 opacity-80" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono font-bold">{data.confidence_score}</span>
            <span className="text-sm font-mono opacity-70">%</span>
          </div>
          <div className="w-full h-1 bg-black/40 rounded-full mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.confidence_score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-current"
            />
          </div>
        </motion.div>
      </div>

      {/* Middle Row: TOD Intelligence Panel */}
      <motion.div variants={itemVariants} className="flex-[1.2] min-h-[300px]">
        <TodIntelligencePanel data={data.tod_estimation} />
      </motion.div>

      {/* Correlation Graph Toggle */}
      <motion.div variants={itemVariants} className="w-full">
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="w-full bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 rounded-sm p-3 flex items-center justify-center gap-2 transition-colors group"
        >
          <Network className={`h-4 w-4 ${showGraph ? 'text-cyan-400' : 'text-slate-400'} group-hover:text-cyan-400 transition-colors`} />
          <span className={`font-mono text-xs tracking-widest uppercase ${showGraph ? 'text-cyan-400' : 'text-slate-400'} group-hover:text-cyan-400 transition-colors`}>
            {showGraph ? "TERMINATE DIGITAL CORRELATION NETWORK" : "INITIALIZE DIGITAL CORRELATION NETWORK"}
          </span>
        </button>
        
        <AnimatePresence>
          {showGraph && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 500, opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full overflow-hidden rounded-sm"
            >
              <EvidenceGraph />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Row: Dynamic based on Document Category */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {data.document_category === "FIR" ? (
          <>
            {/* Entities & Suspects Panel */}
            <motion.div variants={itemVariants} className="flex-1 bg-slate-900/40 border border-slate-800 rounded-sm p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/50">
                <Users className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Entities & Suspects
                </h3>
              </div>
              <ul className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {(data.entities_involved || []).map((entity, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-start gap-3 text-slate-300 font-mono text-sm bg-slate-950/50 p-3 rounded-sm border border-slate-800/50 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-700 shrink-0 mt-1.5"></div>
                    <span>{entity}</span>
                  </motion.li>
                ))}
                {(!data.entities_involved || data.entities_involved.length === 0) && (
                  <div className="text-slate-600 font-mono text-xs text-center py-4 uppercase tracking-widest">No entities identified</div>
                )}
              </ul>
            </motion.div>

            {/* Legal Evidence Panel */}
            <motion.div variants={itemVariants} className="flex-1 bg-slate-900/40 border border-slate-800 rounded-sm p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/50">
                <Scale className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Legal Evidence
                </h3>
              </div>
              <ul className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {(data.legal_evidence || []).map((evidence, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                    className="flex items-start gap-3 text-slate-300 font-mono text-sm bg-slate-950/50 p-3 rounded-sm border border-slate-800/50 hover:border-slate-700 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{evidence}</span>
                  </motion.li>
                ))}
                {(!data.legal_evidence || data.legal_evidence.length === 0) && (
                  <div className="text-slate-600 font-mono text-xs text-center py-4 uppercase tracking-widest">No evidence logged</div>
                )}
              </ul>
            </motion.div>
          </>
        ) : (
          <>
            {/* Injury Patterns Panel */}
            <motion.div variants={itemVariants} className="flex-1 bg-slate-900/40 border border-slate-800 rounded-sm p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/50">
                <Activity className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Injury Patterns
                </h3>
              </div>
              <ul className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {data.injury_patterns?.map((injury, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-start gap-3 text-slate-300 font-mono text-sm bg-slate-950/50 p-3 rounded-sm border border-slate-800/50 hover:border-slate-700 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{injury}</span>
                  </motion.li>
                ))}
                {(!data.injury_patterns || data.injury_patterns.length === 0) && (
                  <div className="text-slate-600 font-mono text-xs text-center py-4 uppercase tracking-widest">No distinct patterns identified</div>
                )}
              </ul>
            </motion.div>

            {/* Medical Observations Panel */}
            <motion.div variants={itemVariants} className="flex-1 bg-slate-900/40 border border-slate-800 rounded-sm p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/50">
                <Stethoscope className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Medical Observations
                </h3>
              </div>
              <ul className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {data.medical_observations?.map((obs, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                    className="flex items-start gap-3 text-slate-300 font-mono text-sm bg-slate-950/50 p-3 rounded-sm border border-slate-800/50 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-700 shrink-0 mt-1.5"></div>
                    <span>{obs}</span>
                  </motion.li>
                ))}
                {(!data.medical_observations || data.medical_observations.length === 0) && (
                  <div className="text-slate-600 font-mono text-xs text-center py-4 uppercase tracking-widest">No significant observations</div>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </div>

      {/* 3D Launch Trigger */}
      <Link 
        href="/scanner"
        className="group relative w-full mt-2 bg-zinc-900/40 border border-cyan-500/50 hover:border-cyan-400 rounded-sm p-4 flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
      >
        <Scan className="h-5 w-5 text-cyan-400 group-hover:animate-[spin_3s_linear_infinite]" />
        <span className="font-mono text-cyan-400 font-bold tracking-widest uppercase text-sm">
          INITIALIZE 3D SPATIAL SCAN
        </span>
        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm pointer-events-none"></div>
      </Link>
    </motion.div>
  );
}
