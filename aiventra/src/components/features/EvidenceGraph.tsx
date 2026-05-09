"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// CRITICAL NEXT.JS RULE: Disable SSR for the canvas engine
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface Node {
  id: string;
  group: string;
  label: string;
  metadata: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  type: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function EvidenceGraph() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Handle responsive resizing and data fetching
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 400, // Fallback height
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Fetch the correlation matrix from our FastAPI backend
    fetch("http://127.0.0.1:8000/api/correlate-evidence")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load correlation graph data:", err);
        setLoading(false);
      });

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Map groups to our enterprise dark theme colors
  const getNodeColor = (group: string) => {
    switch (group) {
      case "victim": return "#ef4444"; // Tailwind red-500
      case "suspect": return "#8b5cf6"; // Tailwind violet-500
      case "infrastructure": return "#3b82f6"; // Tailwind blue-500
      case "evidence": return "#10b981"; // Tailwind emerald-500
      default: return "#0ea5e9"; // Tailwind cyan-500
    }
  };

  // Custom Canvas Rendering for Nodes (includes glowing dots and text)
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = Math.max(12 / globalScale, 4); // Keep text readable
    ctx.font = `${fontSize}px "Roboto Mono", monospace`;
    
    // Draw Glowing Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node.group);
    ctx.shadowColor = getNodeColor(node.group);
    ctx.shadowBlur = 15; // The cyber glow effect
    ctx.fill();
    
    // Reset shadow for text rendering
    ctx.shadowBlur = 0; 
    
    // Draw Main Label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f1f5f9'; // slate-100
    ctx.fillText(label, node.x, node.y + 12 + fontSize);
    
    // Draw Sub-metadata (smaller, dimmer)
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = `${fontSize * 0.8}px "Roboto Mono", monospace`;
    ctx.fillText(node.metadata, node.x, node.y + 12 + (fontSize * 2.2));
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-950/40 border border-slate-800 rounded-sm">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Correlating Evidence Matrix...
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative bg-slate-950/40 border border-slate-800 rounded-sm overflow-hidden group">
      
      {/* UI Overlay: Status */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
         <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
         <span className="text-cyan-500 font-mono text-[10px] md:text-xs tracking-widest uppercase bg-slate-950/50 px-2 py-1 rounded-sm border border-cyan-900/50">
           Spatial Correlation Engine Active
         </span>
      </div>
      
      {/* UI Overlay: Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 font-mono text-[9px] md:text-[10px] uppercase tracking-widest bg-slate-950/80 p-3 rounded-sm border border-slate-800 backdrop-blur-sm pointer-events-none">
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Victim Vector</div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div> Suspect Array</div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> Infrastructure</div>
         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Verified Evidence</div>
      </div>

      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeCanvasObject={drawNode}
        nodeRelSize={6}
        linkColor={() => 'rgba(14, 165, 233, 0.2)'} // Subtle cyan links
        linkWidth={1}
        linkDirectionalParticles={3} // The moving dots on the links
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => '#0ea5e9'} // Bright cyan particles
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="transparent"
      />
    </div>
  );
}
