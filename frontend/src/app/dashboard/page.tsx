'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Activity, AlertTriangle, Loader2, Gauge, Scale, Stethoscope, Network } from 'lucide-react';
import { TodIntelligencePanel, TodEstimation } from '@/components/features/TodIntelligencePanel';
import BodyScanner from '@/components/features/BodyScanner';
import { EvidenceGraph } from '@/components/features/EvidenceGraph';
import { ForensicMetrics } from '@/components/ForensicMetrics';

interface ForensicData {
  document_category?: string;
  probable_cause?: string;
  injury_patterns?: string[];
  medical_observations?: string[];
  entities_involved?: string[];
  legal_evidence?: string[];
  case_insights?: string[];
  tod_estimation?: TodEstimation;
  confidence_score?: number;
  overall_risk_score?: number;
  base_risk_score?: number;
  digital_correlation?: {
    nodes: any[];
    links: any[];
  };
}

// Convert string injury patterns to the Injury objects expected by BodyScanner
function formatInjuries(patterns?: string[]) {
  if (!patterns || patterns.length === 0) return [];
  
  return patterns.map((desc) => {
    const text = desc.toLowerCase();
    let key = "CHEST_LEFT"; // Default fallback
    
    if (text.includes("head") || text.includes("skull") || text.includes("brain") || text.includes("face") || text.includes("eye")) {
      key = "SKULL_FRONT";
    } else if (text.includes("neck") || text.includes("throat") || text.includes("cervical") || text.includes("strangle")) {
      key = "NECK_RIGHT";
    } else if (text.includes("chest") || text.includes("torso") || text.includes("rib") || text.includes("heart") || text.includes("lung") || text.includes("abdomen")) {
      key = "CHEST_LEFT";
    } else if (text.includes("arm") || text.includes("hand") || text.includes("forearm") || text.includes("wrist") || text.includes("shoulder") || text.includes("finger")) {
      key = "FOREARM_LEFT";
    } else if (text.includes("leg") || text.includes("thigh") || text.includes("knee") || text.includes("foot") || text.includes("ankle")) {
      key = "LEG_RIGHT";
    } else if (text.includes("back") || text.includes("spine") || text.includes("lumbar")) {
      key = "BACK_CENTER";
    }
    
    return {
      description: desc,
      anatomical_key: key,
      severity: "HIGH"
    };
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [isParsing, setIsParsing] = useState(true);

  useEffect(() => {
    // Retrieve data on mount
    const payload = localStorage.getItem('dexterx_payload');
    if (payload) {
      try {
        const parsed = JSON.parse(payload);
        setForensicData(parsed);
      } catch (e) {
        console.error("Failed to parse payload", e);
      }
    }
    
    // Simulate high-tech parsing delay for the cinematic effect
    const timer = setTimeout(() => {
      setIsParsing(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isParsing || !forensicData) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-16 h-16 text-[#e83b5b] animate-spin mb-6" />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
          className="text-[#e83b5b] font-bold tracking-[0.3em] text-sm uppercase text-center"
        >
          DECRYPTING PAYLOAD &<br/>ASSEMBLING HOLOGRAPHIC COMMAND CENTER...
        </motion.p>
      </div>
    );
  }

  const isFIR = forensicData.document_category === 'FIR';

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const fadeSlideLeft = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const fadeSlideRight = {
    hidden: { opacity: 0, x: 50 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const fadeSlideUp = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-black relative font-sans text-slate-200">
      <AnimatePresence mode="wait">
        {isFIR ? (
          /* =========================================================
             FIR LAYOUT (LEGAL INTELLIGENCE MODE)
             ========================================================= */
          <motion.div 
            key="fir-layout"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full min-h-screen p-4 lg:p-6 grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* LEFT COLUMN */}
            <motion.div variants={fadeSlideLeft} className="col-span-1 md:col-span-3 flex flex-col gap-6 h-full min-h-[80vh]">
              {/* CASE SUMMARY & CHARGES */}
              <div className="flex-1 bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/20 shadow-[0_0_15px_rgba(232,59,91,0.15)] rounded-xl p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e83b5b]/20 text-[#e83b5b]">
                  <Scale size={18} />
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Case Summary & Charges</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <p className="text-sm font-mono text-slate-200 bg-[#0a0a0a]/80 p-5 rounded-lg border border-[#e83b5b]/10 leading-relaxed shadow-inner">
                    {forensicData.probable_cause || "Pending legal summary generation."}
                  </p>
                </div>
              </div>

              {/* ENTITIES NETWORK */}
              <div className="flex-1 bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/20 shadow-[0_0_15px_rgba(232,59,91,0.15)] rounded-xl p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e83b5b]/20 text-[#e83b5b]">
                  <Network size={18} />
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Entities Network</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="flex flex-wrap gap-3">
                    {forensicData.entities_involved?.length ? forensicData.entities_involved.map((entity, i) => (
                      <span key={i} className="px-4 py-2 bg-[#e83b5b]/10 text-[#ff8fa3] text-xs font-mono border border-[#e83b5b]/30 rounded-md shadow-sm">
                        {entity}
                      </span>
                    )) : (
                      <p className="text-xs font-mono text-slate-500">No core entities identified.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CENTER COLUMN: THE MASSIVE GRAPH */}
            <motion.div variants={fadeSlideUp} className="col-span-1 md:col-span-6 flex flex-col items-center justify-start relative h-[80vh] md:h-auto">
              
              {/* Confidence Score Header */}
              <div className="w-full flex justify-center z-20 mb-6">
                <div className="bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/30 shadow-[0_0_30px_rgba(232,59,91,0.2)] rounded-[2rem] px-12 py-5 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge size={16} className="text-[#e83b5b]" />
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">OVERALL RISK SCORE</h3>
                  </div>
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e83b5b] drop-shadow-[0_0_20px_rgba(232,59,91,0.5)]">
                    {forensicData.overall_risk_score ?? forensicData.base_risk_score ?? 88}%
                  </div>
                </div>
              </div>

              {/* Giant Evidence Graph Container */}
              <div className="flex-1 w-full bg-[#0a0a0a]/80 border border-[#e83b5b]/20 shadow-[0_0_20px_rgba(232,59,91,0.1)] rounded-2xl overflow-hidden relative group">
                <div className="absolute top-6 left-6 z-10 flex items-center gap-2 text-[#e83b5b] bg-[#111111]/80 px-4 py-2 rounded-full border border-[#e83b5b]/30 backdrop-blur-md shadow-lg">
                  <Activity size={16} />
                  <span className="text-[11px] font-bold tracking-widest uppercase">Legal Intelligence Network</span>
                </div>
                <EvidenceGraph data={forensicData.digital_correlation} />
              </div>
            </motion.div>

            {/* RIGHT COLUMN */}
            <motion.div variants={fadeSlideRight} className="col-span-1 md:col-span-3 flex flex-col gap-6 h-full min-h-[80vh]">
              {/* EVIDENCE & DOCUMENTATION */}
              <div className="flex-1 bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/20 shadow-[0_0_15px_rgba(232,59,91,0.15)] rounded-xl p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e83b5b]/20 text-[#e83b5b]">
                  <Scale size={18} />
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Evidence & Documentation</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <ul className="space-y-3">
                    {forensicData.legal_evidence?.length ? forensicData.legal_evidence.map((ev, idx) => (
                      <li key={idx} className="text-xs leading-relaxed font-mono text-slate-300 bg-[#0a0a0a]/60 p-4 rounded-lg border border-slate-800/50 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#e83b5b] shrink-0 mt-1 shadow-[0_0_8px_rgba(232,59,91,0.8)]" />
                        {ev}
                      </li>
                    )) : (
                      <p className="text-xs font-mono text-slate-500">No digital or physical evidence mapped.</p>
                    )}
                  </ul>
                </div>
              </div>

              {/* STRATEGIC INSIGHTS */}
              <div className="flex-1 bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/20 shadow-[0_0_15px_rgba(232,59,91,0.15)] rounded-xl p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e83b5b]/20 text-[#e83b5b]">
                  <Activity size={18} />
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Strategic Insights</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <ul className="space-y-3">
                    {forensicData.case_insights?.length ? forensicData.case_insights.map((insight, idx) => (
                      <li key={idx} className="text-xs leading-relaxed font-mono text-slate-300 bg-[#0a0a0a]/60 p-4 rounded-lg border border-slate-800/50 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-1 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        {insight}
                      </li>
                    )) : (
                      <p className="text-xs font-mono text-slate-500">No strategic insights generated.</p>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* =========================================================
             AUTOPSY / OMNI_SCENE LAYOUT (ORIGINAL)
             ========================================================= */
          <motion.div 
            key="autopsy-layout"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full min-h-screen p-4 lg:p-6 grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* LEFT COLUMN: Biological Triage */}
            <motion.div variants={fadeSlideLeft} className="col-span-1 md:col-span-3 flex flex-col gap-4 h-full min-h-[80vh]">
              <div className="flex-1 bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/20 shadow-[0_0_15px_rgba(232,59,91,0.15)] rounded-xl p-5 flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#e83b5b]/20">
                  <div className="flex items-center gap-2 text-[#e83b5b]">
                    <Activity size={18} />
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Biological Triage</h2>
                  </div>
                  <button 
                    onClick={() => alert('Expanding Biological Vector...')} 
                    className="text-slate-500 hover:text-[#e83b5b] transition-colors"
                    title="EXPAND VECTOR"
                  >
                    <Maximize size={16} />
                  </button>
                </div>

                {/* Content scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                  
                  {/* Probable Cause */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-[#e83b5b]" />
                      Probable Cause
                    </h3>
                    <p className="text-sm font-mono text-slate-200 bg-[#0a0a0a]/80 p-4 rounded-lg border border-[#e83b5b]/10 leading-relaxed shadow-inner">
                      {forensicData.probable_cause || "Pending biological analysis."}
                    </p>
                  </div>

                  {/* TOD Estimation Panel */}
                  {forensicData.tod_estimation && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                         Time of Death Analysis
                      </h3>
                      <div className="bg-[#0a0a0a]/80 p-3 rounded-lg border border-slate-800/50 shadow-inner">
                        <TodIntelligencePanel data={forensicData.tod_estimation} />
                      </div>
                    </div>
                  )}

                  {/* Medical Observations */}
                  {(forensicData.medical_observations?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Stethoscope size={12} className="text-[#e83b5b]" />
                        Medical Observations
                      </h3>
                      <ul className="space-y-2">
                        {forensicData.medical_observations!.map((obs, idx) => (
                          <li key={idx} className="text-[11px] leading-relaxed font-mono text-slate-400 bg-[#0a0a0a]/60 p-3 rounded border border-slate-800/30 flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#e83b5b] shrink-0 mt-1.5 shadow-[0_0_8px_rgba(232,59,91,0.8)]" />
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* CENTER COLUMN: The Hologram */}
            <motion.div variants={fadeSlideUp} className="col-span-1 md:col-span-6 flex flex-col items-center justify-start relative h-[80vh] md:h-auto">
              
              {/* Top Risk Gauge / Confidence */}
              <div className="w-full flex justify-center z-20 mt-4 mb-10">
                <div className="bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/30 shadow-[0_0_30px_rgba(232,59,91,0.2)] rounded-[2rem] px-10 py-5 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge size={16} className="text-[#e83b5b]" />
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">OVERALL RISK SCORE</h3>
                  </div>
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e83b5b] drop-shadow-[0_0_20px_rgba(232,59,91,0.5)]">
                    {forensicData.overall_risk_score ?? forensicData.base_risk_score ?? 92}%
                  </div>
                </div>
              </div>

              {/* Body Scanner */}
              <div className="flex-1 w-full flex items-center justify-center relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                   <BodyScanner injuries={formatInjuries(forensicData.injury_patterns)} />
                 </div>
              </div>

            </motion.div>

            {/* RIGHT COLUMN: Digital Evidence */}
            <motion.div variants={fadeSlideRight} className="col-span-1 md:col-span-3 flex flex-col gap-4 h-full min-h-[80vh]">
              <div className="flex-1 bg-[#111111]/80 backdrop-blur-md border border-[#e83b5b]/20 shadow-[0_0_15px_rgba(232,59,91,0.15)] rounded-xl p-5 flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#e83b5b]/20">
                  <div className="flex items-center gap-2 text-[#e83b5b]">
                    <Scale size={18} />
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Digital Evidence</h2>
                  </div>
                  <button 
                    onClick={() => alert('Expanding Digital Vector...')} 
                    className="text-slate-500 hover:text-[#e83b5b] transition-colors"
                    title="EXPAND VECTOR"
                  >
                    <Maximize size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                  
                  {/* Evidence Graph Container */}
                  <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0a0a0a]/80 shadow-inner relative group">
                     {/* Optional overlay to prevent interaction if desired, or let them interact */}
                     <EvidenceGraph data={forensicData.digital_correlation} />
                  </div>

                  {/* Forensic Data Visualizations */}
                  <ForensicMetrics forensicData={forensicData} />

                  {/* Entities Involved */}
                  {(forensicData.entities_involved?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Entities Identified</h3>
                      <div className="flex flex-wrap gap-2">
                        {forensicData.entities_involved!.map((entity, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#e83b5b]/10 text-[#ff8fa3] text-[10px] font-mono border border-[#e83b5b]/30 rounded-md">
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legal Evidence / Case Insights */}
                  {(forensicData.case_insights || forensicData.legal_evidence) && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Verified Vectors</h3>
                      <ul className="space-y-2">
                        {(forensicData.case_insights || forensicData.legal_evidence || []).map((insight, idx) => (
                          <li key={idx} className="text-[11px] leading-relaxed font-mono text-slate-400 bg-[#0a0a0a]/60 p-3 rounded border border-slate-800/30 flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#e83b5b] shrink-0 mt-1.5 shadow-[0_0_8px_rgba(232,59,91,0.8)]" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
