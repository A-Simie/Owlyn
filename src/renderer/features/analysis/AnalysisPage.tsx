import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { reportsApi, type Report } from "@/api/reports.api";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { sessionId: interviewId } = useParams();
  const { user } = useAuthStore();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<"HIRE" | "DECLINE" | "PENDING" | null>(null);
  const [notes, setNotes] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    let retryCount = 0;
   //public mode
    const isPublicMode = !user;

    const fetchReport = async () => {
      if (!interviewId) return;
      try {
        const data = isPublicMode 
          ? await reportsApi.getPublicReport(interviewId)
          : await reportsApi.getReport(interviewId);
          
        setReport(data);
        if (data.finalDecision) setDecision(data.finalDecision);
        if (data.humanFeedback) setNotes(data.humanFeedback);

        // Architectural requirement: Save ephemeral learning reports to localStorage
        if (isPublicMode) {
          localStorage.setItem(`owlyn_ephemeral_${interviewId}`, JSON.stringify(data));
        }

        setError(null);
        setLoading(false);
      } catch (err: any) {
        // AI grading might take time; retry every 3 seconds for up to 45 seconds (15 attempts)
        const canRetry = (err.status === 400 || err.status === 404) && retryCount < 15;
        
        if (canRetry) {
          retryCount++;
          setTimeout(fetchReport, 3000);
          return;
        }

        // Offline Fallback for public modes
        if (isPublicMode) {
          const cached = localStorage.getItem(`owlyn_ephemeral_${interviewId}`);
          if (cached) {
            try {
              const data = JSON.parse(cached);
              setReport(data);
              setError(null);
              setLoading(false);
              return;
            } catch (e) {
               console.warn("Failed to parse cached report");
            }
          }
        }

        setError(
          err.message || "The AI is taking longer than expected to grade the session. Please refresh in a moment.",
        );
        setLoading(false);
      }
    };
    fetchReport();
  }, [interviewId, user]);

  const handleFinalize = async () => {
    if (!interviewId || !decision) return;
    setIsFinalizing(true);
    try {
      await reportsApi.addFeedback(interviewId, notes, decision);
      alert("Verification complete. Assessment record updated.");
    } catch (err) {
      console.error(err);
      alert("Synchronization error: Failed to persist evaluation.");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
        <div className="size-16 relative">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">
          Processing session data...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center">
        <span className="material-symbols-outlined text-red-500/50 text-5xl mb-6">
          info
        </span>
        <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2">
          Data Unavailable
        </h2>
        <p className="text-slate-500 text-xs max-w-sm mb-8 leading-relaxed">
          {error ||
            "The requested report for this session ID could not be loaded from the server."}
        </p>
        <button
          onClick={() => navigate("/interviews")}
          className="px-8 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const hasFlags =
    report.behaviorFlags && report.behaviorFlags.cheating_warnings_count > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/interviews")}
            className="text-primary hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">
              Exit
            </span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <h1 className="text-xs font-bold text-white uppercase tracking-widest">
            {report.candidateName || report.candidateEmail || "Guest Session"}
          </h1>
        </div>
        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[8px] font-bold text-slate-500 uppercase tracking-widest">
          Session ID: {report.interviewId}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto p-8 gap-8 flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-[#111] p-10 rounded-sm border border-white/5 flex flex-col items-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">
                Total Score
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-8xl font-black text-white tracking-tighter tabular-nums">
                  {report.score || 0}
                </span>
                <span className="text-xl text-primary/40 font-bold uppercase">
                  /100
                </span>
              </div>
            </div>

            <div className="bg-[#111] p-6 rounded-sm border border-white/5 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Proctoring Flags
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={`size-1.5 rounded-full ${hasFlags ? "bg-red-500" : "bg-green-500"}`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                      Visual Authenticity
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black ${hasFlags ? "text-red-500" : "text-green-500"}`}
                  >
                    {hasFlags ? "Flagged" : "Normal"}
                  </span>
                </div>

                {hasFlags && (
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-sm">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">
                      Flag Information:
                    </p>
                    <p className="text-[11px] text-red-200/50 font-light leading-relaxed">
                      Multiple behavioral anomalies detected including eye-tracking deviations or unauthorized browser activity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            <div className="bg-[#111] p-8 rounded-sm border border-white/5 flex flex-col gap-8">
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4">
                  Assessment Summary
                </h3>
                <p className="text-sm font-light leading-relaxed text-slate-300">
                  {report.behavioralNotes}
                </p>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Code Evaluation Detail
                </h4>
                <p className="text-xs font-normal text-slate-200 leading-relaxed italic">
                  "{report.codeOutput}"
                </p>
              </div>
            </div>

            <div className="bg-[#111] p-8 rounded-sm border border-white/5">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                  Human Feedback
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDecision("HIRE")}
                    className={`px-6 py-1.5 rounded-sm border text-[9px] font-black uppercase tracking-widest transition-all ${decision === "HIRE" ? "bg-green-500 text-black border-green-500" : "bg-transparent border-green-500/20 text-green-500"}`}
                  >
                    Recommend Hire
                  </button>
                  <button
                    onClick={() => setDecision("DECLINE")}
                    className={`px-6 py-1.5 rounded-sm border text-[9px] font-black uppercase tracking-widest transition-all ${decision === "DECLINE" ? "bg-red-500 text-black border-red-500" : "bg-transparent border-red-500/20 text-red-500"}`}
                  >
                    Decline
                  </button>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter final recruiter feedback for this session ID..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-sm p-4 text-xs font-light text-slate-300 placeholder:text-slate-800 focus:border-primary/40 focus:outline-none resize-none mb-6"
              />

              <button
                onClick={handleFinalize}
                disabled={isFinalizing || !decision}
                className="w-full py-4 bg-primary text-black text-[10px] font-black uppercase tracking-[0.5em] rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale"
              >
                {isFinalizing ? "Transmitting data..." : "Finalize Evaluation"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
