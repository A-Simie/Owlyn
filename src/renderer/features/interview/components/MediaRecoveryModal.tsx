import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MediaType = "screen" | "camera" | "mic";

interface MediaRecoveryModalProps {
  isOpen: boolean;
  type: MediaType;
  onReshare: () => void;
  onTimeout: () => void;
  countdownSeconds?: number;
  error?: string | null;
  isStarting?: boolean;
}

export default function MediaRecoveryModal({
  isOpen,
  type,
  onReshare,
  onTimeout,
  countdownSeconds = 15,
  error,
  isStarting,
}: MediaRecoveryModalProps) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  // Synchronize timeLeft when the modal is first opened
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(countdownSeconds);
    }
  }, [isOpen, countdownSeconds]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Separate effect for timeout notification to avoid re-triggering logic
  useEffect(() => {
    if (isOpen && timeLeft === 0) {
      onTimeout();
    }
  }, [isOpen, timeLeft, onTimeout]);

  const content = {
    screen: {
      icon: "desktop_access_disabled",
      title: "Screen Share Lost",
      text: "Continuous screen sharing is required for proctoring. Please re-authorize screen sharing immediately.",
      button: "Reshare Screen",
    },
    camera: {
      icon: "videocam_off",
      title: "Camera Access Lost",
      text: "Visual presence is required for verification. Please restore camera permissions immediately.",
      button: "Restore Camera",
    },
    mic: {
      icon: "mic_off",
      title: "Microphone Access Lost",
      text: "Audio monitoring is required for this session. Please restore microphone access immediately.",
      button: "Restore Microphone",
    },
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="max-w-md w-full bg-[#0D0D0D] border border-red-500/20 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]"
          >
            <div className="size-24 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
              <span
                className="material-symbols-outlined text-red-500 text-5xl animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {content.icon}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
              {content.title}
            </h2>

            <p className="text-slate-400 text-[10px] font-bold leading-relaxed uppercase tracking-widest mb-8">
              {content.text}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={onReshare}
                disabled={isStarting}
                className={`w-full py-4 ${isStarting ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:brightness-110 active:scale-[0.98]"} text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-xl transition-all flex items-center justify-center gap-3`}
              >
                <span className={`material-symbols-outlined text-sm ${isStarting ? "animate-spin" : ""}`}>
                  {isStarting ? "progress_activity" : "refresh"}
                </span>
                {isStarting ? "Recovering..." : content.button}
              </button>

              {error && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                  {error}
                </p>
              )}

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
