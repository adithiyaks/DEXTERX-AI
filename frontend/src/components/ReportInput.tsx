"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileText, Loader2, AlertTriangle, UploadCloud } from "lucide-react";

interface ReportInputProps {
  onSubmit: (payload: string | File) => Promise<void>;
}

export function ReportInput({ onSubmit }: ReportInputProps) {
  const [activeTab, setActiveTab] = useState<"text" | "upload">("text");
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "text" && !text.trim()) return;
    if (activeTab === "upload" && !selectedFile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (activeTab === "text") {
        await onSubmit(text);
      } else {
        await onSubmit(selectedFile!);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process input.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
      {/* UI Layout Tabs */}
      <div className="flex bg-slate-900/50 p-1 rounded-sm border border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => { setActiveTab("text"); setError(null); }}
          className={`flex-1 py-1.5 text-xs font-mono font-semibold tracking-widest uppercase rounded-sm transition-all ${
            activeTab === "text" ? "bg-cyan-600 text-slate-950" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          Text Entry
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("upload"); setError(null); }}
          className={`flex-1 py-1.5 text-xs font-mono font-semibold tracking-widest uppercase rounded-sm transition-all ${
            activeTab === "upload" ? "bg-cyan-600 text-slate-950" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          Document Upload
        </button>
      </div>

      <div className="flex-1 relative flex flex-col overflow-hidden min-h-[200px]">
        <AnimatePresence mode="wait">
          {activeTab === "text" ? (
            <motion.div
              key="text"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <label htmlFor="report_text" className="sr-only">Unstructured Report Text</label>
              <textarea
                id="report_text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste unstructured autopsy or forensic report here..."
                className="flex-1 w-full resize-none bg-slate-950/50 border border-slate-800 rounded-sm p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 custom-scrollbar"
                disabled={isSubmitting}
              />
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50 pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 pointer-events-none"></div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <div 
                className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-sm p-6 cursor-pointer transition-all ${
                  selectedFile 
                    ? "border-cyan-500 bg-cyan-950/10" 
                    : "border-slate-700 bg-slate-950/50 hover:bg-slate-900/50 hover:border-slate-600"
                }`}
                onClick={() => document.getElementById("pdf-upload")?.click()}
              >
                <input 
                  type="file" 
                  id="pdf-upload" 
                  accept=".pdf" 
                  className="hidden" 
                  disabled={isSubmitting}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0]);
                      setError(null);
                    }
                  }}
                />
                <UploadCloud className={`h-8 w-8 mb-3 transition-colors ${selectedFile ? "text-cyan-500" : "text-slate-600"}`} />
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-cyan-400 font-mono text-sm mb-1 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-slate-500 font-mono text-xs">Ready for processing</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-400 font-mono text-sm mb-1">Click to browse or drag PDF</p>
                    <p className="text-slate-600 font-mono text-xs">Case files & reports (Max 10MB)</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 shrink-0">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-red-400 text-xs bg-red-950/30 p-3 rounded-sm border border-red-900/50"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-mono">{error}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (activeTab === "text" ? !text.trim() : !selectedFile)}
          className="group relative w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold py-3 px-4 rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          
          <span className="relative flex items-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="tracking-widest uppercase text-xs">Processing...</span>
              </>
            ) : (
              <>
                {activeTab === "text" ? <FileText className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                <span className="tracking-widest uppercase text-xs">Run Analysis Vector</span>
                <Send className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </>
            )}
          </span>
        </button>
      </div>
    </form>
  );
}
