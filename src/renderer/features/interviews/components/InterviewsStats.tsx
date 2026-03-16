interface InterviewsStatsProps {
  live: number;
  upcoming: number;
  completed: number;
  total: number;
}

export function InterviewsStats({ live, upcoming, completed, total }: InterviewsStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <StatCard label="Live" value={live} icon="sensors" colorClass="text-red-400" bgClass="bg-red-500/10" />
      <StatCard label="Upcoming" value={upcoming} icon="schedule" colorClass="text-blue-400" bgClass="bg-blue-500/10" />
      <StatCard label="Completed" value={completed} icon="check_circle" colorClass="text-green-400" bgClass="bg-green-500/10" />
      <StatCard label="Total" value={total} icon="owl" colorClass="text-primary" bgClass="bg-primary/10" />
    </div>
  );
}

function StatCard({ label, value, icon, colorClass, bgClass }: { label: string; value: number; icon: string; colorClass: string; bgClass: string }) {
  return (
    <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`${bgClass} p-2 rounded-lg`}>
          <span className={`material-symbols-outlined ${colorClass}`}>{icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
