interface MonitoringHeaderProps {
  interview: any;
  onExit: () => void;
  participantCount: number;
  trackCount: number;
}

export function MonitoringHeader({ interview, onExit, participantCount, trackCount }: MonitoringHeaderProps) {
  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-6">
        <button onClick={onExit} className="text-primary hover:text-white transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Back</span>
        </button>
        <div className="h-4 w-px bg-white/10 mx-2" />
        <div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em]">Live God-View</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            Watching: {interview?.candidateName || "Candidate"} · {interview?.title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-sm">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Stream Active</span>
        </div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm text-[8px] uppercase tracking-widest text-slate-400">
          Participants {participantCount} · Tracks {trackCount}
        </div>
        <button onClick={onExit} className="px-6 py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-all">
          Stop Monitoring
        </button>
      </div>
    </header>
  );
}
