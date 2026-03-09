import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({
    title: "",
    duration: "",
    id: "",
    isPractice: false,
  });

  useEffect(() => {
    const isPractice = localStorage.getItem("owlyn_practice_mode") === "true";
    const title =
      localStorage.getItem("owlyn_interview_title") ||
      (isPractice ? "Practice Session" : "Technical Interview");
    const id = localStorage.getItem("owlyn_access_code")
      ? localStorage.getItem("owlyn_access_code")
      : "GUEST";

    setSessionInfo({
      title,
      duration: isPractice ? "No Limit" : "45 Minutes",
      id: id || "",
      isPractice,
    });
  }, []);

  const handleStart = () => {
    setIsStarting(true);
    // Directly navigate to interview interface
    navigate("/interview");
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
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Position
              </p>
              <p className="text-lg font-bold text-white uppercase tracking-tight">
                {sessionInfo.title}
              </p>
            </div>
            <div className="space-y-3 border-l border-white/5 pl-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Duration
              </p>
              <p className="text-lg font-bold text-primary uppercase tracking-tight">
                {sessionInfo.duration}
              </p>
            </div>
          </div>

          <div className="p-5 bg-black/40 border border-white/5 rounded-sm flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Access ID
            </span>
            <span className="text-[10px] font-mono font-bold text-white">
              {sessionInfo.id}
            </span>
          </div>

          <div className="pt-4">
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
