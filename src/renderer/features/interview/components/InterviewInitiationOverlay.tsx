import { motion } from "framer-motion";

interface InterviewInitiationOverlayProps {
  isCommenced: boolean;
  isEnding: boolean;
  shouldConnect: boolean;
  isConnected: boolean;
  isStartingMedia: boolean;
  mediaError: string | null;
  onPublishMedia: () => void;
}

export default function InterviewInitiationOverlay({
  isCommenced,
  isEnding,
  shouldConnect,
  isConnected,
  isStartingMedia,
  mediaError,
  onPublishMedia,
}: InterviewInitiationOverlayProps) {
  if (isCommenced || isEnding) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
    >
      <div className="max-w-md w-full p-12 text-center space-y-8 bg-[#0D0D0D] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
        {(isStartingMedia || (shouldConnect && !isConnected)) && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
            className="absolute top-0 left-0 h-1 bg-primary/40 shadow-[0_0_10px_rgba(197,159,89,0.5)]"
          />
        )}

        <div className="space-y-4">
          <div className="size-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              owl
            </span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {!shouldConnect ? "Interview Portal" : "Commencing Session"}
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
            {!shouldConnect
              ? "Establish connection and begin session"
              : !isConnected
                ? "Establishing secure connection..."
                : "Syncing media & transcripts..."}
          </p>
          {mediaError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                {mediaError}
              </p>
            </motion.div>
          )}
        </div>

        <div className="w-full">
          {!isConnected ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 animate-pulse">
                Establishing Secure Connection...
              </span>
            </div>
          ) : (
            <button
              onClick={onPublishMedia}
              disabled={isStartingMedia}
              className="group relative w-full py-3 bg-primary text-black font-black uppercase tracking-[0.3em] text-[13px] rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_50px_rgba(197,159,89,0.3)] flex items-center justify-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {isStartingMedia ? (
                <>
                  <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span className="animate-pulse">Initializing...</span>
                </>
              ) : (
                <>
                  Enter Session
                  <span className="material-symbols-outlined text-xl">login</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
