import { useMemo } from "react";
import Pagination from "@/components/shared/Pagination";
import { useTalentPool } from "./hooks/useTalentPool";
import { TalentSidebar } from "./components/TalentSidebar";
import { TalentPoolTable } from "./components/TalentPoolTable";
import { TalentSpotlight } from "./components/TalentSpotlight";
import { TalentActivityFeed } from "./components/TalentActivityFeed";

export default function TalentPoolPage() {
  const {
    reports,
    loading,
    searchQuery, setSearchQuery,
    roleFilter, setRoleFilter,
    minScore, setMinScore,
    statusFilter, setStatusFilter,
    topPerformer,
    currentPage, setCurrentPage,
    candidates,
    filteredCandidates,
    pagedCandidates,
    handleDelete,
    handleExport,
    itemsPerPage
  } = useTalentPool();

  const stats = useMemo(() => ({
    total: candidates.length,
    highPotential: candidates.filter((c) => c.score >= 85).length,
    avgScore: candidates.length
      ? (candidates.reduce((a, b) => a + b.score, 0) / candidates.length).toFixed(1) + "%"
      : "0%",
  }), [candidates]);

  const spotlight = useMemo(() => {
    if (!topPerformer) return null;
    return {
      id: topPerformer.interviewId,
      name: topPerformer.candidateName || topPerformer.candidateEmail || "Elite Candidate",
      score: topPerformer.score || 0,
    };
  }, [topPerformer]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B0B0B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Loading talent pool...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-100 h-full overflow-hidden flex flex-col font-sans">
      <main className="flex-1 flex overflow-hidden">
        <TalentSidebar 
          total={stats.total}
          highPotential={stats.highPotential}
          avgScore={stats.avgScore}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          minScore={minScore}
          setMinScore={setMinScore}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onReset={() => {
            setSearchQuery("");
            setRoleFilter("All Roles");
            setMinScore(0);
            setStatusFilter(null);
          }}
        />

        <section className="flex-1 flex flex-col relative overflow-hidden bg-[#0D0D0D]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-light text-white">Talent Pool</h2>
                <p className="text-sm text-slate-500 mt-1">Found {filteredCandidates.length} elite profiles matching your criteria.</p>
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-xs font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export List
              </button>
            </div>

            <TalentPoolTable candidates={pagedCandidates} onDelete={handleDelete} />

            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredCandidates.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </section>

        <aside className="w-80 border-l divider surface-alt flex flex-col overflow-hidden bg-[#0B0B0B]">
          <TalentSpotlight candidate={spotlight} />
          <TalentActivityFeed reports={reports} />
        </aside>
      </main>
    </div>
  );
}
