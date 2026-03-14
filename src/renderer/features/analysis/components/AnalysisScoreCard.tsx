import { Report } from "@/api/reports.api";

interface AnalysisScoreCardProps {
  report: Report;
}

export function AnalysisScoreCard({ report }: AnalysisScoreCardProps) {
  const hasFlags = report.behaviorFlags && report.behaviorFlags.cheating_warnings_count > 0;

  return (
    <div className="space-y-8">
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
              <span className={`size-1.5 rounded-full ${hasFlags ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                Visual Authenticity
              </span>
            </div>
            <span className={`text-[10px] font-black ${hasFlags ? "text-red-500" : "text-green-500"}`}>
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
  );
}
