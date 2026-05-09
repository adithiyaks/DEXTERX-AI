"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportInput } from '@/components/ReportInput';

import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { TodEstimation } from '@/components/features/TodIntelligencePanel';

// Define the shape of the data returned by FastAPI
interface AnalysisResult {
  probable_cause: string;
  injury_patterns: string[];
  medical_observations: string[];
  tod_estimation: TodEstimation;
  confidence_score: number;
}

export default function Home() {
  const [forensicData, setForensicData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (inputData: string | File) => {
    setIsLoading(true);
    setError(null);

    try {
      let response;

      // Check if the input is a File object (PDF) or a string (Text)
      if (inputData instanceof File) {
        const formData = new FormData();
        formData.append("file", inputData);

        response = await fetch("http://127.0.0.1:8000/api/upload-document", {
          method: "POST",
          body: formData, // Notice: No 'Content-Type' header here, fetch handles the multipart boundary automatically
        });
      } else {
        response = await fetch("http://127.0.0.1:8000/api/analyze-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report_text: inputData }),
        });
      }

      if (!response.ok) throw new Error("Failed to analyze forensic data.");

      const data = await response.json();
      setForensicData(data);

    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw so ReportInput catches it for the UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full bg-slate-950">
      {/* LEFT PANE: Data Input (30%) */}
      <section className="w-[30%] border-r border-slate-800 flex flex-col bg-slate-900/30">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Case Input Vector
          </h2>
          <span className="text-[10px] font-mono text-slate-600 tracking-widest border border-slate-800 px-1.5 py-0.5 rounded-sm">
            TXT / PDF
          </span>
        </div>
        <div className="p-4 flex-1">
          <ReportInput onSubmit={handleAnalyze} />
        </div>
      </section>

      {/* RIGHT PANE: Investigation Dashboard (70%) */}
      <section className="w-[70%] flex flex-col relative overflow-hidden bg-slate-950">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Intelligence Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${forensicData ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${forensicData ? 'bg-cyan-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className={`text-xs font-mono uppercase tracking-wider ${forensicData ? 'text-cyan-500' : 'text-slate-500'}`}>
              {forensicData ? 'System Active' : 'Standby'}
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!forensicData ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-sm bg-slate-900/10"
              >
                <div className="w-16 h-16 border border-slate-800 rounded-full flex items-center justify-center mb-4 bg-slate-950">
                  <div className="w-2 h-2 bg-slate-700 rounded-full animate-pulse"></div>
                </div>
                <span className="text-slate-600 font-mono text-sm tracking-widest uppercase">
                  Awaiting Data Stream
                </span>
              </motion.div>
            ) : (
              <AnalysisDashboard key="dashboard-state" data={forensicData} />
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
