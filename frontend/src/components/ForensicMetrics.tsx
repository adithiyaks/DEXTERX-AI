"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, Thermometer } from "lucide-react";

interface ForensicMetricsProps {
  forensicData?: any; // The JSON payload
}

export function ForensicMetrics({ forensicData }: ForensicMetricsProps) {
  if (!forensicData) return <div />;

  // Chart 1: Thermodynamic Delta Data
  const bodyTemp = forensicData.tod_metrics?.body_temp_f;
  const ambientTemp = forensicData.tod_metrics?.ambient_temp_f;
  
  const thermodynamicData = bodyTemp && ambientTemp ? [
    { name: "Body Temp", temp: bodyTemp, fill: "#06B6D4" }, // Cyan
    { name: "Ambient", temp: ambientTemp, fill: "#475569" } // Slate
  ] : null;

  // Chart 2: Threat Matrix Data
  const riskScore = forensicData.overall_risk_score ?? forensicData.base_risk_score ?? 0;
  
  const threatData = [
    { name: "Risk", value: riskScore },
    { name: "Safe Margin", value: 100 - riskScore }
  ];

  const RISK_COLOR = riskScore > 80 ? "#EF4444" : "#06B6D4"; // Red if critical, Cyan if lower
  const SAFE_COLOR = "#0F172A"; // Dark slate/transparent

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Thermodynamic Delta Chart */}
      {thermodynamicData && (
        <div className="bg-zinc-900/30 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col h-[250px]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-cyan-500/20 text-cyan-500">
            <Thermometer size={16} />
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Thermodynamic Delta</h2>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={thermodynamicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px", fontSize: "12px", color: "#F8FAFC" }} 
                />
                <Bar dataKey="temp" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Threat Matrix Donut Chart */}
      <div className="bg-zinc-900/30 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col h-[250px] relative">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cyan-500/20 text-cyan-500">
          <AlertCircle size={16} />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Threat Matrix</h2>
        </div>
        
        <div className="flex-1 w-full relative flex items-center justify-center">
           {/* Center Text */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
              <span className={`text-4xl font-black ${riskScore > 80 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}>
                {riskScore}%
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">RISK LEVEL</span>
           </div>
           
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={threatData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                <Cell key="cell-risk" fill={RISK_COLOR} />
                <Cell key="cell-safe" fill={SAFE_COLOR} />
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px", fontSize: "12px", color: "#F8FAFC" }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
