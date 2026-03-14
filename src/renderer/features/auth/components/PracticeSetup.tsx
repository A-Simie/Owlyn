import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";
import { extractApiError } from "@/lib/api-error";

const PRACTICE_LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi"];

interface PracticeSetupProps {
  onBack: () => void;
}

export function PracticeSetup({ onBack }: PracticeSetupProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("General Software Engineering");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [duration, setDuration] = useState(30);
  const [language, setLanguage] = useState("English");

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateApi.startPracticeSession({ topic, difficulty, durationMinutes: duration, language });
      useCandidateStore.getState().setSession({
        token: res.token,
        livekitToken: res.livekitToken,
        interviewId: res.interviewId,
        accessCode: "PRACTICE",
        title: res.title,
        durationMinutes: res.durationMinutes,
        candidateName: res.candidateName,
        personaName: res.personaName,
        toolsEnabled: res.toolsEnabled ?? res.config?.toolsEnabled,
      });
      useCandidateStore.getState().setPracticeMode(true);
      navigate("/calibration");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] p-10 rounded-lg shadow-2xl space-y-8 border border-white/5">
      <div className="flex flex-col items-center space-y-6 text-center">
        <button onClick={onBack} className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Choose different mode
        </button>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Practice Setup</h2>
          <p className="text-slate-500 text-xs font-light tracking-wide">Configure your simulated interview environment.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary uppercase tracking-[2px]">Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. React Frontend..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-[2px]">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer">
              <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-[2px]">Duration (min)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer">
              <option value={15}>15 Minutes</option><option value={30}>30 Minutes</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-primary uppercase tracking-[2px]">Interview Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer">
            {PRACTICE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}

        <button onClick={handleStart} disabled={loading} className="w-full py-5 bg-[#c59f59] text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-primary/20">
          {loading ? <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" /> : "Launch Practice Session"}
        </button>
      </div>
    </motion.div>
  );
}
