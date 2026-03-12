import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reportsApi } from "@/api/reports.api";
import type { Report } from "@/api/reports.api";

export default function TalentPoolPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [minScore, setMinScore] = useState(85);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const circumference = 2 * Math.PI * 18;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportsApi.getAllReports();
        setReports(data || []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const candidates = useMemo(() => {
    return reports.map((r) => ({
      id: r.interviewId,
      name: r.candidateName || r.candidateEmail || "Anonymous",
      score: r.score || 0,
      status: (r.score || 0) > 85 ? "HIGHLY RECOMMENDED" : "Under Review",
      statusColor:
        (r.score || 0) > 85
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20",
      date: "Recent Session",
      online: false,
      borderPrimary: (r.score || 0) > 85,
    }));
  }, [reports]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch = c.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "All Roles";
      const matchesScore = (c.score || 0) >= minScore;
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesRole && matchesScore && matchesStatus;
    });
  }, [candidates, searchQuery, roleFilter, minScore, statusFilter]);

  const spotlightCandidate = useMemo(() => {
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => b.score - a.score)[0];
  }, [candidates]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this candidate?")) {
      setReports((prev) => prev.filter((r) => r.interviewId !== id));
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(filteredCandidates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talent-pool-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center surface overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">
            Loading evaluation data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-slate-100 h-full overflow-hidden flex flex-col">
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r divider surface-alt flex flex-col p-6 overflow-y-auto">
          <div className="space-y-4 mb-10">
            {[
              {
                label: "Evaluations Total",
                value: candidates.length,
                change: "Lifetime",
              },
              {
                label: "High Potential",
                value: candidates.filter((c) => c.score >= 85).length,
                change: "Top Tier",
              },
              {
                label: "Average Score",
                value: candidates.length
                  ? (
                      candidates.reduce((a, b) => a + b.score, 0) /
                      candidates.length
                    ).toFixed(1) + "%"
                  : "0%",
                change: "Aggregate",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl surface-card hover:border-primary/30 transition-all"
              >
                <p className="text-[10px] uppercase tracking-widest text-subtle mb-1">
                  {stat.label}
                </p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-heading">
                    {stat.value}
                  </h3>
                  <span className="text-xs text-green-500 mb-1">
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
              Advanced Filters
            </h4>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-subtle tracking-tighter">
                Search Name or Role
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg text-xs text-body focus:border-primary focus:ring-0 py-2 px-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-subtle tracking-tighter">
                Candidate Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg text-xs text-body focus:border-primary focus:ring-0 py-2 px-3"
              >
                <option value="All Roles">All Roles</option>
                <option value="Senior Frontend Engineer">
                  Senior Frontend Engineer
                </option>
                <option value="Backend Architect">Backend Architect</option>
                <option value="Fullstack Developer">Fullstack Developer</option>
                <option value="AI / ML Engineer">AI / ML Engineer</option>
                <option value="DevOps Lead">DevOps Lead</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Product Manager">Product Manager</option>
                <option value="QA Engineer">QA Engineer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-subtle tracking-tighter">
                Minimum AI Score ({minScore}%)
              </label>
              <input
                className="w-full h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-subtle mt-2">
                <span>0%</span>
                <span className="text-primary font-bold">{minScore}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-subtle tracking-tighter">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "HIGHLY RECOMMENDED"
                        ? null
                        : "HIGHLY RECOMMENDED",
                    )
                  }
                  className={`px-2 py-1 text-[10px] rounded border transition-all ${statusFilter === "HIGHLY RECOMMENDED" ? "border-primary bg-primary/20 text-primary" : "border-slate-200 dark:border-primary/10 text-subtle hover:border-primary/40"}`}
                >
                  High Rec
                </button>
                <button
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "Under Review" ? null : "Under Review",
                    )
                  }
                  className={`px-2 py-1 text-[10px] rounded border transition-all ${statusFilter === "Under Review" ? "border-primary bg-primary/20 text-primary" : "border-slate-200 dark:border-primary/10 text-subtle hover:border-primary/40"}`}
                >
                  Review
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("All Roles");
                setMinScore(0);
                setStatusFilter(null);
              }}
              className="w-full py-2 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-all rounded-lg mt-4"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Main Table */}
        <section className="flex-1 flex flex-col surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-light text-heading">
                  Talent Pool
                </h2>
                <p className="text-sm text-muted mt-1">
                  Found {filteredCandidates.length} elite profiles matching your
                  criteria.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 surface-elevated text-xs font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg"
              >
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
                Export List
              </button>
            </div>

            <div className="rounded-xl surface-card overflow-x-auto border border-slate-100 dark:border-primary/10">
              <div className="min-w-[800px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-primary/5">
                    <tr>
                      {[
                        "Candidate",
                        "AI Score",
                        "Status",
                        "Session Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70 ${h === "AI Score" ? "text-center" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                    {filteredCandidates.map((c) => {
                      const dashoffset =
                        circumference - (c.score / 100) * circumference;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => navigate(`/analysis/${c.id}`)}
                          className="group hover:bg-primary/[0.03] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div
                                  className={`w-10 h-10 rounded-full ${c.borderPrimary ? "border-2 border-primary" : "border border-slate-200 dark:border-primary/20"} bg-primary/10 flex items-center justify-center`}
                                >
                                  <span className="material-symbols-outlined text-primary text-sm">
                                    person
                                  </span>
                                </div>
                                {c.online && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-obsidian rounded-full" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-heading">
                                  {c.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center">
                              <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    className="text-primary/10"
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  />
                                  <circle
                                    className="text-primary"
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashoffset}
                                    strokeWidth="2"
                                  />
                                </svg>
                                <span className="absolute text-[10px] font-bold text-primary">
                                  {c.score}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border uppercase ${c.statusColor}`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-subtle">
                            {c.date}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(c.id);
                                }}
                                className="material-symbols-outlined text-red-400 hover:text-red-500 transition-colors text-xl"
                              >
                                delete
                              </button>
                              <button className="material-symbols-outlined text-slate-400 dark:text-slate-600 hover:text-primary transition-colors">
                                more_vert
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCandidates.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-subtle"
                        >
                          No candidates found matching the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>


      </main>
    </div>
  );
}
