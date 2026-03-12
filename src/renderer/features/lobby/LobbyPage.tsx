import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { interviewTitle, isPracticeMode, accessCode, token, candidateName } = useCandidateStore();

  useEffect(() => {
    // Pre-Flight Health Check
    candidateApi.healthCheck().catch((err) => {
      console.error("Health check failed:", err);
    });
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      if (!isPracticeMode) {
        // Start Interview Lockdown
        await candidateApi.initiateLockdown(accessCode!, token!);
      }
      navigate("/interview");
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(err?.response?.data?.message || "This interview session is inactive or already completed. Please contact your recruiter.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      <main className="w-full max-w-xl z-10 space-y-10">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">
            Session Details
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Review the information below before starting.
          </p>
        </header>

        <div className="bg-[#111] border border-white/5 rounded-sm p-10 space-y-10">
          {candidateName && (
            <div className="text-center pb-4 border-b border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">
                Candidate
              </p>
              <h2 className="text-2xl font-black text-white uppercase italic">
                {candidateName}
              </h2>
            </div>
          )}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Position
              </p>
              <p className="text-lg font-bold text-white uppercase tracking-tight">
                {interviewTitle}
              </p>
            </div>
            <div className="space-y-3 border-l border-white/5 pl-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Interviewer
              </p>
              <p className="text-lg font-bold text-primary uppercase tracking-tight">
                {isPracticeMode ? "AI Tutor" : (useCandidateStore.getState().personaName || "Owlyn")}
              </p>
            </div>
          </div>

          <div className="p-5 bg-black/40 border border-white/5 rounded-sm flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Access ID
            </span>
            <span className="text-[10px] font-mono font-bold text-white">
              {accessCode || "GUEST"}
            </span>
          </div>

          <div className="pt-4 space-y-4">
            {error && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center animate-pulse">
                {error}
              </p>
            )}
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.4em] text-xs rounded-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Enter Interview
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
