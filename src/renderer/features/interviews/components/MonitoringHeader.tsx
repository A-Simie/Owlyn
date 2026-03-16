import { useState } from "react";

interface MonitoringHeaderProps {
  interview: any;
  onExit: () => void;
  participantCount: number;
  trackCount: number;
}

export function MonitoringHeader({ interview, onExit, participantCount, trackCount }: MonitoringHeaderProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    onExit();
  };

  return (
    <header className="h-16 border-b border-primary/10 flex items-center justify-between px-8 bg-[#0D0D0D]/80 backdrop-blur-xl shrink-0 z-[60]">
      <div className="flex items-center gap-6">
        <button 
          onClick={handleExit} 
          disabled={isExiting}
          className="text-primary hover:text-white transition-all flex items-center gap-2 group"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_left_alt</span>
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Back</span>
        </button>
        <div className="h-4 w-px bg-primary/20 mx-2" />
        <div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] gold-gradient-text">Live God-View</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            Watching: {interview?.candidateName || "Candidate"} · {interview?.title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
          <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(197,159,89,0.5)]" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Stream Active</span>
        </div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm text-[8px] uppercase tracking-widest text-slate-400">
          Participants {participantCount} · Tracks {trackCount}
        </div>
        <button 
          onClick={handleExit} 
          disabled={isExiting}
          className="px-6 py-2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          {isExiting ? "Exiting..." : "Exit Dashboard"}
        </button>
      </div>
    </header>
  );
}
