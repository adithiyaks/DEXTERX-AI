import Link from 'next/link';
import { ArrowLeft, Activity } from 'lucide-react';
import BodyScanner from '@/components/features/BodyScanner';

const demoInjuries = [
  { description: "Deep jagged laceration across the right carotid artery", anatomical_key: "NECK_RIGHT", severity: "CRITICAL" },
  { description: "Defensive stab wounds on the forearms", anatomical_key: "FOREARM_LEFT", severity: "High" }
];

export default function ScannerPage() {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-50">
      {/* Tech-focused Action Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-6 shrink-0">
        <Link 
          href="/" 
          className="group flex items-center gap-2 text-cyan-500 hover:text-cyan-400 transition-all font-mono text-xs tracking-widest uppercase"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Return to Intelligence Hub
        </Link>

        <div className="flex items-center gap-2 text-red-500 font-mono text-xs tracking-widest uppercase">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="animate-pulse">Live Spatial Mapping</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex flex-col overflow-y-auto relative">
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col relative z-10">
          <BodyScanner injuries={demoInjuries} />
        </div>
      </main>
    </div>
  );
}
