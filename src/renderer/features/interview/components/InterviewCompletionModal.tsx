import { motion } from "framer-motion";

interface InterviewCompletionModalProps {
  onClose: () => void;
  candidateName?: string | null;
}

export default function InterviewCompletionModal({ onClose, candidateName }: InterviewCompletionModalProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-[#0D0D0D] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(197,159,89,0.15)] relative"
      >
        <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 size-64 bg-blue-500/5 blur-[100px] -z-10 rounded-full" />

        <div className="p-12 text-center flex flex-col items-center gap-8">
          <div className="size-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center relative">
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="material-symbols-outlined text-5xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </motion.span>   
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
              Interview Complete
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Congratulations{candidateName ? `, ${candidateName}` : ""}, you have successfully concluded the interview.
            </p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <div className="space-y-6">
            <div className="flex flex-col gap-2">

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Our evaluation engine is currently processing your performance. 
                <span className="block mt-1 text-slate-500">A detailed analytical report will be sent to you shortly.</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-primary text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/10"
            >
              Exit to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
