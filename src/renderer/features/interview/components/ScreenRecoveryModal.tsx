import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScreenRecoveryModalProps {
  isOpen: boolean;
  onReshare: () => void;
  onTimeout: () => void;
  countdownSeconds?: number;
}

export default function ScreenRecoveryModal({
  isOpen,
  onReshare,
  onTimeout,
  countdownSeconds = 15,
}: ScreenRecoveryModalProps) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(countdownSeconds);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onTimeout, countdownSeconds]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="max-w-md w-full bg-[#0D0D0D] border border-red-500/20 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)]"
          >
            <div className="size-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-red-500 text-4xl animate-pulse">
                screen_share_off
              </span>
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
              Screen Share Lost
            </h2>
            
            <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-widest mb-8">
              Continuous screen sharing is required for proctoring. 
              Please re-authorize screen sharing immediately to maintain the session.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={onReshare}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-sm">screen_share</span>
                Reshare Screen
              </button>

              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Auto-Terminating in:
                </span>
                <span className="text-lg font-mono text-red-500 font-bold">
                  {timeLeft}s
                </span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-red-500"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / countdownSeconds) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
