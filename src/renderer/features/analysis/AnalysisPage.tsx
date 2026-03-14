import { useNavigate } from "react-router-dom";
import { useAnalysisReport } from "./hooks/useAnalysisReport";
import { AnalysisScoreCard } from "./components/AnalysisScoreCard";
import { AnalysisFeedbackForm } from "./components/AnalysisFeedbackForm";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { report, loading, error, interviewId } = useAnalysisReport();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
        <div className="size-16 relative">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Processing session data...</p>
      </div>
    );
  }

  if (error || !report || !interviewId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center">
        <span className="material-symbols-outlined text-red-500/50 text-5xl mb-6">info</span>
        <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Data Unavailable</h2>
        <p className="text-slate-500 text-xs max-w-sm mb-8 leading-relaxed">{error || "The requested report for this session ID could not be loaded."}</p>
        <button onClick={() => navigate("/interviews")} className="px-8 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/interviews")} className="text-primary hover:text-white transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Exit</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <h1 className="text-xs font-bold text-white uppercase tracking-widest">{report.candidateName || report.candidateEmail || "Guest Session"}</h1>
        </div>
        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[8px] font-bold text-slate-500 uppercase tracking-widest">Session ID: {report.interviewId}</span>
      </header>

      <main className="flex-1 overflow-y-auto p-8 gap-8 flex flex-col custom-scrollbar">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4">
            <AnalysisScoreCard report={report} />
          </div>

          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            <div className="bg-[#111] p-8 rounded-sm border border-white/5 flex flex-col gap-8">
              <div>
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4">Assessment Summary</h3>
                <p className="text-sm font-light leading-relaxed text-slate-300">{report.behavioralNotes}</p>
              </div>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Code Evaluation Detail</h4>
                <p className="text-xs font-normal text-slate-200 leading-relaxed italic">"{report.codeOutput}"</p>
              </div>
            </div>

            <AnalysisFeedbackForm 
              interviewId={interviewId} 
              initialNotes={report.humanFeedback || ""} 
              initialDecision={report.finalDecision || null} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
