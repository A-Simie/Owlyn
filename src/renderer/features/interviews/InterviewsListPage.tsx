import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useInterviewsList } from "./hooks/useInterviewsList";
import { useCreateInterview } from "./hooks/useCreateInterview";
import { InterviewsStats } from "./components/InterviewsStats";
import { InterviewsTable } from "./components/InterviewsTable";
import { CreateInterviewModal } from "./components/CreateInterviewModal";
import Pagination from "@/components/shared/Pagination";
import { useClipboard } from "@/hooks/useClipboard";

export default function InterviewsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdAccessCode, setCreatedAccessCode] = useState<string | null>(null);
  const { copy, hasCopied: justCopied } = useClipboard();

  const {
    interviews, activeTab, setActiveTab, currentPage, setCurrentPage,
    pagedInterviews, filteredInterviews, stats, fetchInterviews, itemsPerPage
  } = useInterviewsList();

  const createFlow = useCreateInterview((code) => {
    setCreatedAccessCode(code);
    setShowCreateModal(false);
    fetchInterviews();
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true") {
      setShowCreateModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const tabs = [
    { key: "all", label: "All", count: stats.all },
    { key: "UPCOMING", label: "Upcoming", count: stats.upcoming },
    { key: "COMPLETED", label: "Completed", count: stats.completed },
    { key: "CANCELLED", label: "Cancelled", count: stats.cancelled },
  ] as const;

  return (
    <div className="min-h-screen p-8 lg:p-12 max-w-5xl font-sans">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Interviews</h1>
          <p className="text-slate-500 text-sm">Manage your scheduled and past interview sessions.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-lg">add</span> New Interview
        </button>
      </div>

      <InterviewsStats upcoming={stats.upcoming} completed={stats.completed} total={stats.all} />

      <div className="flex gap-1 mb-6 bg-[#0d0d0d] p-1 rounded-lg border border-primary/10 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"}`}>
            {tab.label} <span className={`ml-2 text-[10px] ${activeTab === tab.key ? "text-primary/60" : "text-slate-600"}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <InterviewsTable interviews={pagedInterviews} />

      <Pagination currentPage={currentPage} totalItems={filteredInterviews.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />

      {showCreateModal && (
        <CreateInterviewModal 
          onClose={() => setShowCreateModal(false)}
          step={createFlow.step} setStep={createFlow.setStep}
          newInterview={createFlow.newInterview} setNewInterview={createFlow.setNewInterview}
          personas={createFlow.personas}
          draftedQuestions={createFlow.draftedQuestions} setDraftedQuestions={createFlow.setDraftedQuestions}
          isGenerating={createFlow.isGenerating} isCreating={createFlow.isCreating}
          onGenerate={createFlow.generateQuestions} onCreate={createFlow.createInterview}
        />
      )}

      {createdAccessCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-primary/20 w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6 border border-green-500/20">
              <span className="material-symbols-outlined text-green-400 text-3xl">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Interview Created!</h3>
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">Copy the access code and send it to the candidate</p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold text-primary font-mono tracking-[0.5em]">{createdAccessCode}</p>
              <button 
                onClick={() => createdAccessCode && copy(createdAccessCode)} 
                className="mt-4 flex items-center gap-2 mx-auto text-primary/60 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{justCopied ? "check_circle" : "content_copy"}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{justCopied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
            <button onClick={() => setCreatedAccessCode(null)} className="w-full py-4 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:brightness-110">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
