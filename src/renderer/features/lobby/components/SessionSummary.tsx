import { useCandidateStore } from "@/stores/candidate.store";

export function SessionSummary() {
  const { interviewTitle, isPracticeMode, accessCode, candidateName, durationMinutes, personaName } = useCandidateStore();

  return (
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
            {isPracticeMode ? "Owlyn" : (personaName || "Owlyn")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black/40 border border-white/5 rounded-sm flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Access ID
          </span>
          <span className="text-[9px] font-mono font-bold text-white">
            {accessCode || "GUEST"}
          </span>
        </div>
        <div className="p-4 bg-black/40 border border-white/5 rounded-sm flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Duration
          </span>
          <span className="text-[9px] font-mono font-bold text-primary">
            {durationMinutes || 30} MIN
          </span>
        </div>
      </div>
    </div>
  );
}
