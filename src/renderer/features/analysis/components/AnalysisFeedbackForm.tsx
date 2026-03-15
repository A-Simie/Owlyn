import { useState } from "react";
import { reportsApi, type Report } from "@/api/reports.api";

interface AnalysisFeedbackFormProps {
  interviewId: string;
  initialNotes: string;
  initialDecision: "HIRE" | "DECLINE" | "PENDING" | null;
}

export function AnalysisFeedbackForm({ interviewId, initialNotes, initialDecision }: AnalysisFeedbackFormProps) {
  const [decision, setDecision] = useState(initialDecision);
  const [notes, setNotes] = useState(initialNotes);
  const [isFinalizing, setIsFinalizing] = useState(false);

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

  if (initialDecision && initialDecision !== "PENDING") {
    return null;
  }

  return (
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
        placeholder="Enter final recruiter feedback..."
        className="w-full h-32 bg-black/40 border border-white/10 rounded-sm p-4 text-xs font-light text-slate-300 placeholder:text-slate-800 focus:border-primary/40 focus:outline-none resize-none mb-6"
      />

      <button
        onClick={handleFinalize}
        disabled={isFinalizing || !decision}
        className="w-full py-4 bg-primary text-black text-[10px] font-black uppercase tracking-[0.5em] rounded-xl hover:brightness-110 transition-all disabled:opacity-30 disabled:grayscale"
      >
        {isFinalizing ? "Transmitting data..." : "Finalize Evaluation"}
      </button>
    </div>
  );
}
