import { useNavigate } from "react-router-dom";

interface TalentSpotlightProps {
  candidate: { id: string; name: string; score: number } | null;
}

export function TalentSpotlight({ candidate }: TalentSpotlightProps) {
  const navigate = useNavigate();

  return (
    <div className="p-6 border-b divider font-sans">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Talent Spotlight</h4>
      {candidate ? (
        <div
          onClick={() => navigate(`/analysis/${candidate.id}`)}
          className="relative group cursor-pointer overflow-hidden rounded-xl surface-elevated h-32 flex items-center justify-center border border-primary/10 hover:border-primary/40 transition-all bg-primary/5"
        >
          <span className="material-symbols-outlined text-primary/20 text-6xl group-hover:scale-110 transition-transform duration-500">person</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
          <div className="absolute bottom-3 left-3">
            <p className="text-xs font-bold text-white mb-0.5">{candidate.name}</p>
            <p className="text-[10px] text-primary uppercase tracking-tighter">Top Performer</p>
          </div>
          <div className="absolute top-3 right-3 bg-primary text-black px-2 py-0.5 rounded-lg font-bold text-[10px] shadow-lg">
            {candidate.score} AI Rank
          </div>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center border border-dashed border-primary/10 rounded-xl bg-primary/[0.02]">
          <span className="material-symbols-outlined text-primary/20 text-3xl mb-2">analytics</span>
          <p className="text-[10px] text-subtle uppercase tracking-widest">No Spotlight Available</p>
        </div>
      )}
    </div>
  );
}
