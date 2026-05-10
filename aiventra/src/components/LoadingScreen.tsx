"use client";

import { motion } from "framer-motion";
import { Zap, Loader, Eye } from "lucide-react";

interface LoadingScreenProps {
  status?: "video-upload" | "yolo-processing" | "analysis" | "complete";
  progress?: number;
}

export function LoadingScreen({ status = "yolo-processing", progress = 0 }: LoadingScreenProps) {
  const statusMessages = {
    "video-upload": "Uploading forensic footage...",
    "yolo-processing": "Running YOLOv8 object detection...",
    "analysis": "Analyzing detection results...",
    "complete": "Processing complete!"
  };

  const statusEmojis = {
    "video-upload": "📹",
    "yolo-processing": "🔍",
    "analysis": "⚡",
    "complete": "✓"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-slate-500/20"></div>
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-cyan-500" />
        </svg>
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Logo Area */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="text-cyan-500"
          >
            <Eye className="h-16 w-16" />
          </motion.div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest text-center uppercase">
            Print in
          </h1>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 text-center uppercase tracking-widest">
            Loading AR
          </h2>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Animated loading bars */}
          <div className="w-full space-y-2">
            <div className="flex gap-1 justify-center">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-8 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full"
                  animate={{
                    scaleY: [0.5, 1, 0.5],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    repeat: Infinity
                  }}
                />
              ))}
            </div>
          </div>

          {/* Status message */}
          <motion.div
            className="flex items-center gap-2 text-slate-300 font-mono text-sm uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>{statusEmojis[status]}</span>
            <span>{statusMessages[status]}</span>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="w-full h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </motion.div>

          {/* Progress text */}
          <motion.p
            className="text-xs text-slate-500 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {progress > 0 ? `${progress}% complete` : "Initializing..."}
          </motion.p>
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Status bar at bottom */}
      <motion.div
        className="absolute bottom-6 left-6 right-6 border border-slate-700 rounded-sm p-3 bg-slate-900/50 backdrop-blur"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-xs text-slate-400 font-mono text-center">
          {status === "yolo-processing"
            ? "Processing video frames through YOLOv8 neural network..."
            : status === "analysis"
            ? "Correlating detections with forensic analysis..."
            : "Preparing augmented reality visualization..."}
        </p>
      </motion.div>
    </motion.div>
  );
}
