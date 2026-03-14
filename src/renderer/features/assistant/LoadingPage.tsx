import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";
import { extractApiError } from "@/lib/api-error";

export default function AssistantLoadingPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initializing Assistant...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await candidateApi.startAssistantSession();
        useCandidateStore.getState().setSession({
          token: res.token,
          livekitToken: res.livekitToken,
          interviewId: res.interviewId,
          accessCode: "TUTOR",
          title: res.title,
          durationMinutes: res.durationMinutes,
          candidateName: res.candidateName,
          personaName: res.personaName
        });
        useCandidateStore.getState().setAssistantMode(true);
        
        setStatus("AI Assistant is Live");
        
        setTimeout(async () => {
           if (window.owlyn?.window?.setWidgetMode) {
             await window.owlyn.window.setWidgetMode(true);
           }
           navigate("/assistant");
        }, 1500);

      } catch (err) {
        setError(extractApiError(err).message);
      }
    };

    startSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.05),transparent_70%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 z-10"
      >
        <div className="relative">
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="size-32 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mx-auto"
          >
            <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(197,159,89,0.5)]">
              owl
            </span>
          </motion.div>
          <div className="absolute inset-0 size-32 mx-auto rounded-full border-t-2 border-primary animate-spin" />
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.h2 
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-black text-white uppercase tracking-tight"
            >
              {status}
            </motion.h2>
          </AnimatePresence>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-xs mx-auto"
          >
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest leading-relaxed">
              {error}
            </p>
            <button 
              onClick={() => navigate("/auth?step=candidate-options")}
              className="mt-4 text-[10px] font-black text-white underline uppercase tracking-widest"
            >
              Return to login
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
