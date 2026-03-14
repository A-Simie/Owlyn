interface TalentSidebarProps {
  total: number;
  highPotential: number;
  avgScore: string;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  minScore: number;
  setMinScore: (v: number) => void;
  statusFilter: string | null;
  setStatusFilter: (v: string | null) => void;
  onReset: () => void;
}

export function TalentSidebar({ 
  total, highPotential, avgScore, searchQuery, setSearchQuery, roleFilter, setRoleFilter, minScore, setMinScore, statusFilter, setStatusFilter, onReset 
}: TalentSidebarProps) {
  return (
    <aside className="w-64 border-r divider surface-alt flex flex-col p-6 overflow-y-auto shrink-0 font-sans">
      <div className="space-y-4 mb-10">
        {[
          { label: "Evaluations Total", value: total },
          { label: "High Potential", value: highPotential },
          { label: "Average Score", value: avgScore },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl surface-card border border-white/5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-subtle mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-heading">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Filters</h4>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-subtle tracking-tighter">Search Name</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-slate-50 dark:bg-[#0B0B0B] border border-slate-200 dark:border-primary/20 rounded-lg text-xs py-2 px-3 outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-subtle tracking-tighter">Min AI Score ({minScore}%)</label>
          <input
            className="w-full h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
            type="range" min="0" max="100" value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-subtle tracking-tighter">Status</label>
          <div className="flex flex-wrap gap-2">
            {["HIGHLY RECOMMENDED", "Under Review"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={`px-2 py-1 text-[10px] rounded border transition-all ${statusFilter === s ? "border-primary bg-primary/20 text-primary" : "border-slate-200 dark:border-primary/10 text-subtle"}`}
              >
                {s === "HIGHLY RECOMMENDED" ? "High Rec" : "Review"}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onReset} className="w-full py-2 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest rounded-lg mt-4">Reset</button>
      </div>
    </aside>
  );
}
