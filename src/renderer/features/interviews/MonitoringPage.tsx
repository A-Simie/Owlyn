import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { interviewsApi } from "@/api";

export default function MonitoringPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      if (!interviewId) return;
      try {
        const data = await interviewsApi.getInterview(interviewId);
        setInterview(data);
      } catch (err) {
        console.error("Failed to fetch interview for monitoring:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [interviewId]);

  // Mocking live feed
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/interviews")}
            className="text-primary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.3em]">
              Live Interview Monitoring
            </h1>
            <p className="text-[10px] text-primary/60 font-medium uppercase tracking-widest flex items-center gap-2">
              <span className="size-1.5 bg-red-500 rounded-full animate-pulse" />{" "}
              Session ID: {interviewId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Candidate:{" "}
            </span>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {interview?.candidateName || "Awaiting Data..."}
            </span>
          </div>
          <button
            onClick={() => navigate("/interviews")}
            className="px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
          >
            Terminate Session
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Main Feed */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-black rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="material-symbols-outlined text-9xl text-white">
                videocam_off
              </span>
            </div>
            {/* Client Uplink Stream */}
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-sm">
              Candidate Desktop
            </div>

            <div className="absolute bottom-4 right-4 size-48 bg-black/80 rounded-lg border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-black/60 text-[8px] font-bold uppercase tracking-widest rounded-sm">
                Webcam Feed
              </div>
              <div className="w-full h-full flex items-center justify-center text-[10px] uppercase text-primary/20 font-black">
                FEED OFF
              </div>
            </div>
          </div>

          <div className="h-48 bg-black/40 rounded-xl border border-white/5 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black primary uppercase tracking-[0.2em] text-primary">
                Live Session Status
              </h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                Stream Activity
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded text-[10px] text-slate-600 uppercase tracking-widest">
              Analyzing micro-expressions and voice patterns...
            </div>
          </div>
        </div>

        {/* Sidebar Intel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6">
              Integrity Metrics
            </h3>
            <div className="space-y-6">
              <p className="text-[10px] text-slate-500 italic text-center py-4">
                Waiting for real-time telemetry...
              </p>
            </div>
          </div>

          <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl p-6 flex flex-col overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6">
              Real-time Insights
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-primary/20 text-4xl mb-2">
                history
              </span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                No active signals
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricBar({
  label,
  value,
  color,
  inverse = false,
}: {
  label: string;
  value: number;
  color: string;
  inverse?: boolean;
}) {
  const displayValue = inverse ? 100 - value : value;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </span>
        <span className={`text-xs font-black ${color}`}>{displayValue}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full bg-current ${color}`}
        />
      </div>
    </div>
  );
}

function PulseMessage({
  time,
  text,
  type,
}: {
  time: string;
  text: string;
  type: "info" | "warning" | "success";
}) {
  const colors = {
    info: "border-white/10 text-slate-300",
    warning: "border-red-500/20 text-red-100 bg-red-500/5",
    success: "border-primary/20 text-primary bg-primary/5",
  };
  return (
    <div
      className={`p-4 border rounded-sm ${colors[type]} animate-in fade-in slide-in-from-right-2 duration-500`}
    >
      <div className="flex justify-between mb-1">
        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
          Status: {type}
        </span>
        <span className="text-[8px] font-mono opacity-40">{time}</span>
      </div>
      <p className="text-xs font-light leading-relaxed">{text}</p>
    </div>
  );
}
