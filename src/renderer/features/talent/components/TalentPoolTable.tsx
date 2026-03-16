import { useNavigate } from "react-router-dom";

interface TalentPoolTableProps {
  candidates: any[];
  onDelete: (id: string) => void;
}

export function TalentPoolTable({ candidates, onDelete }: TalentPoolTableProps) {
  const navigate = useNavigate();
  const circumference = 2 * Math.PI * 18;

  return (
    <div className="rounded-xl surface-card overflow-x-auto border border-slate-100 dark:border-primary/10 bg-[#0d0d0d]/40">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="bg-primary/5">
          <tr>
            {["Candidate", "AI Score", "Status", "Session", ""].map((h) => (
              <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
          {[...candidates].sort((a, b) => b.score - a.score).map((c) => {
            const dashoffset = circumference - (c.score / 100) * circumference;
            return (
              <tr key={c.id} onClick={() => navigate(`/analysis/${c.id}`)} className="group hover:bg-primary/[0.03] transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full ${c.borderPrimary ? "border-2 border-primary" : "border border-slate-200 dark:border-primary/20"} bg-primary/10 flex items-center justify-center relative`}>
                        <span className="material-symbols-outlined text-primary text-sm">{c.isTop ? "workspace_premium" : "person"}</span>
                        {c.isTop && <div className="absolute -top-1 -right-1 size-4 bg-primary text-black rounded-full flex items-center justify-center text-[8px] font-black border-2 border-[#0B0B0B]">1</div>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-heading">{c.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative w-10 h-10 flex items-center justify-center mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-primary/10" cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeWidth="2" />
                      <circle className="text-primary" cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeWidth="2" />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-primary">{c.score}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border uppercase ${c.statusColor}`}>{c.status}</span>
                </td>
                <td className="px-6 py-4 text-xs text-subtle">{c.date}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="material-symbols-outlined text-red-400 hover:text-red-500 transition-colors text-xl">delete</button>
                    <button className="material-symbols-outlined text-slate-400 dark:text-slate-600 hover:text-primary transition-colors">more_vert</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
