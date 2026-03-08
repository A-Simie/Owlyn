import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({
    title: "Senior Software Engineer Interview",
    duration: "45 Minutes",
    id: "#UXD-2024-0812",
    isPractice: false,
  });

  useEffect(() => {
    const isPractice = localStorage.getItem("owlyn_practice_mode") === "true";
    const title =
      localStorage.getItem("owlyn_interview_title") ||
      (isPractice
        ? "Mock Technical Evaluation"
        : "Scheduled Technical Interview");
    const id = localStorage.getItem("owlyn_access_code")
      ? `#${localStorage.getItem("owlyn_access_code")}`
      : "#GUEST-STAGING";

    setSessionInfo({
      title,
      duration: isPractice ? "No Limit" : "45 Minutes",
      id,
      isPractice,
    });
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    // Simulating protocol activation delay
    await new Promise((r) => setTimeout(r, 2000));
    navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.05),transparent_70%)] pointer-events-none" />

      <main className="w-full max-w-2xl z-10 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
      
          <h1 className="text-6xl font-black tracking-tight text-white leading-tight uppercase">
            Session <span className="text-[#c59f59]">Ready.</span>
          </h1>
          <p className="text-slate-500 text-lg font-light max-w-lg mx-auto leading-relaxed">
            The interview session will begin immediately upon
            entry.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="surface-card border border-white/5 rounded-lg p-10 space-y-10 relative overflow-hidden"
        >
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-600">
                Session Title
              </p>
              <p className="text-2xl font-bold text-white tracking-tight leading-tight uppercase">
                {sessionInfo.title}
              </p>
            </div> 
            <div className="space-y-4 border-l border-white/5 pl-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-600">
                Expected Time
              </p>
              <p className="text-2xl font-bold text-[#c59f59] tracking-tight uppercase">
                {sessionInfo.duration}
              </p>
            </div>
          </div>

        

          <div className="pt-6">
            <AnimatePresence mode="wait">
              {!isStarting ? (
                <motion.button
                  key="btn-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleStart}
                  className="group relative w-full py-4 bg-[#c59f59] text-black font-bold uppercase tracking-[0.6em] text-sm rounded-sm overflow-hidden transition-all aion-glow hover:brightness-110 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    Initiate Session
                    <span className="material-symbols-outlined text-lg">
                      bolt
                    </span>
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  key="starting-protocol"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-[88px] border border-[#c59f59]/30 bg-[#c59f59]/5 rounded-sm flex flex-col items-center justify-center gap-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-2 bg-[#c59f59] rounded-full animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#c59f59]">
                      Synchronizing Cloud Node
                    </span>
                  </div>
                  <div className="w-[200px] h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#c59f59]"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function SecurityTag({
  label,
  status,
  icon,
}: {
  label: string;
  status: string;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-sm">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-xl text-slate-600">
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
          {label}
        </span>
      </div>
      <span
        className={`text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm bg-black border border-white/5 ${status === "Linked" ? "text-green-500" : "text-[#c59f59]"}`}
      >
        {status}
      </span>
    </div>
  );
}
