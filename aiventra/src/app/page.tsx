'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, X, ArrowRight, Scan, Activity, Video } from 'lucide-react';
import ColorBends from '@/components/ColorBends';

export default function GatewayPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert("Please upload a PDF document.");
      }
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'video/mp4') {
        setSelectedVideo(file);
      } else {
        alert("Please upload an MP4 video file.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert("Please upload a PDF document.");
      }
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (activeTab === 'text' && !textInput.trim() && !selectedVideo) {
      alert("Please enter text override data or attach a video.");
      return;
    }
    if (activeTab === 'pdf' && !selectedFile) {
      alert("Please select a PDF document.");
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (activeTab === 'text') {
        if (selectedVideo) {
          // Multimodal: Text + Video -> process-cctv
          const formData = new FormData();
          formData.append('file', selectedVideo);
          formData.append('report_text', textInput);
          response = await fetch('http://127.0.0.1:8000/api/process-cctv', {
            method: 'POST',
            body: formData,
          });
        } else {
          // Text only -> analyze-report
          response = await fetch('http://127.0.0.1:8000/api/analyze-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ report_text: textInput }),
          });
        }
      } else {
        // PDF -> upload-document
        const formData = new FormData();
        formData.append('file', selectedFile!);
        response = await fetch('http://127.0.0.1:8000/api/upload-document', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.detail) errorMessage += ` - ${errData.detail}`;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      localStorage.setItem('dexterx_payload', JSON.stringify(data));
      router.push('/dashboard');
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to initiate analysis. Please check console for details.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#050505] relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden font-sans">
      {/* ColorBends Background */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <ColorBends
          colors={["#e83b5b", "#3f3f3f", "#000000"]}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          noise={0.15}
          parallax={0.5}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
          transparent
          autoRotate={0}
          color="#e83b5b"
        />
      </div>

      {/* Main Content Overlay */}
      <div className="relative z-10 w-full max-w-[700px] flex flex-col items-center">

        {/* Header Title */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl lg:text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-3 tracking-tighter"
          >
            DEXTERX AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xs font-bold tracking-[0.4em] text-slate-300 uppercase drop-shadow-md"
          >
            OMNI-SCENE INTELLIGENCE GATEWAY
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full bg-[#111111]/80 backdrop-blur-3xl border border-[#2a2a2a] rounded-[2rem] p-8 shadow-2xl flex flex-col space-y-6"
        >
          {/* Choose Input Method */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-4 uppercase">Choose Input Method</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Option 1: Text */}
              <div
                onClick={() => setActiveTab('text')}
                className={`relative p-[1px] rounded-[1.25rem] cursor-pointer transition-all duration-500 group overflow-hidden ${activeTab === 'text' ? 'bg-gradient-to-br from-[#e83b5b] to-[#9a2138] shadow-[0_0_20px_rgba(232,59,91,0.25)]' : 'bg-[#222222] hover:bg-[#2a2a2a]'}`}
              >
                <div className={`h-full rounded-[1.25rem] p-5 flex flex-col justify-between transition-colors duration-500 ${activeTab === 'text' ? 'bg-[#1a1314]/90 backdrop-blur-md' : 'bg-[#181818]/80 backdrop-blur-md'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl border transition-all duration-500 flex-shrink-0 ${activeTab === 'text' ? 'bg-[#e83b5b]/20 text-[#ff8fa3] border-[#e83b5b]/40 shadow-[0_0_15px_rgba(232,59,91,0.3)]' : 'bg-[#2a2a2a]/80 text-slate-400 border-[#333333]'}`}>
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 mt-0.5">
                      <h4 className={`text-xs font-bold tracking-wider transition-colors duration-500 ${activeTab === 'text' ? 'text-[#ff8fa3]' : 'text-slate-300'}`}>TEXT OVERRIDE</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed pr-2">Input custom context or investigative directives</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: PDF */}
              <div
                onClick={() => setActiveTab('pdf')}
                className={`relative p-[1px] rounded-[1.25rem] cursor-pointer transition-all duration-500 group overflow-hidden ${activeTab === 'pdf' ? 'bg-gradient-to-br from-[#e83b5b] to-[#9a2138] shadow-[0_0_20px_rgba(232,59,91,0.25)]' : 'bg-[#222222] hover:bg-[#2a2a2a]'}`}
              >
                <div className={`h-full rounded-[1.25rem] p-5 flex flex-col justify-between transition-colors duration-500 ${activeTab === 'pdf' ? 'bg-[#1a1314]/90 backdrop-blur-md' : 'bg-[#181818]/80 backdrop-blur-md'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl border transition-all duration-500 flex-shrink-0 ${activeTab === 'pdf' ? 'bg-[#e83b5b]/20 text-[#ff8fa3] border-[#e83b5b]/40 shadow-[0_0_15px_rgba(232,59,91,0.3)]' : 'bg-[#2a2a2a]/80 text-slate-400 border-[#333333]'}`}>
                      <UploadCloud size={18} />
                    </div>
                    <div className="flex-1 mt-0.5">
                      <h4 className={`text-xs font-bold tracking-wider transition-colors duration-500 ${activeTab === 'pdf' ? 'text-[#ff8fa3]' : 'text-slate-300'}`}>DOCUMENT UPLOAD</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed pr-2">Upload forensic reports or evidence files</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="mt-2">
            <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-4 uppercase">Input Your Intelligence Context</h3>
            <div className="h-[260px] bg-[#0c0c0c]/80 border border-[#2a2a2a] rounded-[1.25rem] p-1.5 relative shadow-inner">
              <AnimatePresence mode="wait">
                {activeTab === 'text' ? (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="h-full flex flex-col p-4 bg-[#141414]/80 rounded-xl"
                  >
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter unstructured intelligence, FIR details, autopsy findings, or any investigative context here..."
                      className="w-full flex-1 bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-600 text-[13px] resize-none leading-relaxed font-sans"
                    />
                    
                    {/* Multimodal CCTV Upload Area */}
                    <div className="mt-3 pt-3 border-t border-[#333333] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <input type="file" ref={videoInputRef} onChange={handleVideoSelect} accept=".mp4" className="hidden" />
                        {selectedVideo ? (
                          <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#e83b5b]/30 rounded-lg p-2.5 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <Video size={16} className="text-[#e83b5b] flex-shrink-0" />
                              <span className="text-xs font-mono text-slate-200 truncate">{selectedVideo.name}</span>
                            </div>
                            <button onClick={clearVideo} className="ml-2 p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full md:w-auto flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] hover:border-[#e83b5b]/50 hover:text-slate-200 transition-all rounded-lg py-2.5 px-4 group"
                          >
                            <Video size={14} className="group-hover:text-[#e83b5b] transition-colors" />
                            Attach CCTV Evidence (.mp4)
                          </button>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-slate-600 font-mono tracking-wider flex-shrink-0">
                        {textInput.length} / 5000
                      </div>
                    </div>

                    </motion.div>
                  ) : (
                  <motion.div
                    key="pdf"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="h-full relative bg-[#141414]/80 rounded-xl"
                  >
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => !selectedFile && fileInputRef.current?.click()}
                      className={`w-full h-full border border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 group
                               ${selectedFile ? 'border-[#e83b5b]/40 bg-[#e83b5b]/5' : 'border-[#333333] hover:border-[#e83b5b]/50 hover:bg-[#1a1a1a] cursor-pointer'}`}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf" className="hidden" />

                      {selectedFile ? (
                        <div className="flex items-center gap-5 p-6 w-full">
                          <div className="w-14 h-14 rounded-2xl bg-[#e83b5b]/10 border border-[#e83b5b]/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(232,59,91,0.15)]">
                            <FileText className="text-[#e83b5b]" size={28} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-white font-semibold text-[13px] tracking-wide truncate">{selectedFile.name}</p>
                            <p className="text-slate-500 text-[11px] mt-1 font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button onClick={clearFile} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg">
                            <UploadCloud className="text-slate-400 group-hover:text-[#e83b5b] transition-colors" size={24} />
                          </div>
                          <p className="text-slate-300 text-[13px] font-semibold tracking-wide">Drag & Drop PDF or Click to Browse</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="relative w-full h-[72px] mt-2 rounded-2xl bg-gradient-to-r from-[#902035] via-[#e83b5b] to-[#902035] flex items-center justify-center overflow-hidden group transition-all duration-500 shadow-[0_0_40px_rgba(232,59,91,0.25)] hover:shadow-[0_0_60px_rgba(232,59,91,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-1.5 z-10">
                <div className="flex items-center gap-3">
                  <Activity className="animate-spin text-white" size={20} />
                  <span className="text-white font-bold tracking-[0.3em] text-[13px]">PROCESSING...</span>
                </div>
                {activeTab === 'text' && selectedVideo && (
                  <span className="text-[#ff8fa3] text-[9px] font-mono tracking-widest uppercase animate-pulse">
                    🔍 YOLO DETECTION IN PROGRESS...
                  </span>
                )}
              </div>
            ) : (
              <>
                <div className="absolute left-6 w-11 h-11 rounded-full bg-[#0a0a0a]/40 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Scan className="text-white" size={18} />
                  {/* Rotating dashed border effect */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-white/40 animate-[spin_4s_linear_infinite]" />
                </div>
                <span className="text-white font-bold tracking-[0.3em] text-[13px] ml-4 drop-shadow-md z-10">INITIATE OMNI-ANALYSIS</span>
                <div className="absolute right-8 text-white/70 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                  <ArrowRight size={22} />
                </div>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
