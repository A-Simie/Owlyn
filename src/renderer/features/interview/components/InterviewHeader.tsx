import { motion, AnimatePresence } from "framer-motion";
import { useCandidateStore } from "@/stores/candidate.store";
import { useSessionStore } from "@/stores/session.store";

interface InterviewHeaderProps {
  isConnected: boolean;
  isProcessing: boolean;
  onEndSession: () => void;
  formatTime: (s: number) => string;
  isWidget?: boolean;
}

export default function InterviewHeader({
  isConnected,
  isProcessing,
  onEndSession,
  formatTime,
  isWidget,
}: InterviewHeaderProps) {
  const { durationMinutes } = useCandidateStore();
  const { elapsedSeconds } = useSessionStore();

  if (isWidget) return null;

  return (
    <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#0D0D0D] z-50">
      <div className="flex items-center gap-4">
        <div className="size-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            owl
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
            Active Session
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className={`size-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              {isConnected ? "Live" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {isProcessing && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-8 top-20 z-[60] py-2 px-4 bg-primary/20 border border-primary/30 rounded-full backdrop-blur-md flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 pointer-events-none"
            >
              <div className="size-2 bg-primary rounded-full animate-ping" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                Owlyn is Reviewing your code...
              </span>
              <div className="size-2 bg-primary rounded-full animate-ping" />
            </motion.div>
          </AnimatePresence>
        )}
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-black tracking-widest text-primary/60 mb-1">
            Remaining
          </span>
          <span className="text-lg font-mono text-white tracking-widest">
            {formatTime(Math.max(0, (durationMinutes || 30) * 60 - elapsedSeconds))}
          </span>
        </div>
        <button
          onClick={onEndSession}
          className="px-6 py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
        >
          End Session
        </button>
      </div>
    </header>
  );
}
