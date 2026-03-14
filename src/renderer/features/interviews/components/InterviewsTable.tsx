import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { InterviewListItem } from "@shared/schemas/interview.schema";
import { useClipboard } from "@/hooks/useClipboard";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UPCOMING: { label: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ACTIVE: { label: "Active", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  COMPLETED: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  CANCELLED: { label: "Cancelled", color: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20" },
};

interface InterviewsTableProps {
  interviews: InterviewListItem[];
}

export function InterviewsTable({ interviews }: InterviewsTableProps) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { copy } = useClipboard();

  const handleCopy = async (id: string, code: string) => {
    const success = await copy(code);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {interviews.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <span className="material-symbols-outlined text-4xl mb-3 block">event_busy</span>
          <p className="text-sm font-medium">No interviews found</p>
        </div>
      )}
      {interviews.map((interview) => {
        const cfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG["UPCOMING"];
        return (
          <div key={interview.interviewId} className="bg-[#0d0d0d] border border-primary/10 rounded-xl p-5 flex items-center justify-between hover:border-primary/25 transition-colors group">
            <div className="flex items-center gap-5">
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <span className="text-primary font-bold text-sm uppercase">{interview.title[0]}</span>
              </div>
              <div>
                {interview.candidateName && <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5">{interview.candidateName}</div>}
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-bold text-white">{interview.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono group/code cursor-pointer relative">
                    <span className="material-symbols-outlined text-xs">tag</span>
                    {interview.accessCode}
                    <button onClick={() => handleCopy(interview.interviewId, interview.accessCode)} className="opacity-0 group-hover/code:opacity-100 ml-1 p-1 hover:text-primary transition-all rounded flex items-center gap-1.5">
                      {copiedId === interview.interviewId && <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Copied!</span>}
                      <span className="material-symbols-outlined text-xs">{copiedId === interview.interviewId ? "check_circle" : "content_copy"}</span>
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {interview.status === "ACTIVE" && (
                <button onClick={() => navigate(`/monitor/${interview.interviewId}`)} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-colors animate-pulse">
                  <span className="material-symbols-outlined text-sm">visibility</span> Monitor LIVE
                </button>
              )}
              {interview.status === "COMPLETED" && (
                <button onClick={() => navigate(`/analysis/${interview.interviewId}`)} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-sm">analytics</span> Results
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
