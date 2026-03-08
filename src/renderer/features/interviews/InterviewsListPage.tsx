import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { interviewsApi } from "@/api/interviews.api";
import { personasApi } from "@/api/personas.api";
import { extractApiError } from "@/lib/api-error";
import type { Persona } from "@shared/schemas/persona.schema";
import type { InterviewListItem } from "@shared/schemas/interview.schema";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: "schedule",
  },
  ACTIVE: {
    label: "Active",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    icon: "play_circle",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    icon: "check_circle",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
    icon: "cancel",
  },
};

type TabFilter = "all" | "UPCOMING" | "COMPLETED" | "CANCELLED";

export default function InterviewsListPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<"info" | "questions">("info");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [newInterview, setNewInterview] = useState({
    title: "",
    jobTitle: "",
    instructions: "",
    questionCount: 5,
    personaId: "",
    durationMinutes: 45,
    toolsEnabled: { codeEditor: true, whiteboard: false, notes: true },
  });
  const [draftedQuestions, setDraftedQuestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdAccessCode, setCreatedAccessCode] = useState<string | null>(
    null,
  );

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await interviewsApi.getInterviews();
      setInterviews(data);
    } catch (error) {
      console.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
    personasApi.getPersonas().then(setPersonas).catch(console.error);

    // Check for ?create=true deep link
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setShowCreateModal(true);
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchInterviews]);

  const filtered =
    activeTab === "all"
      ? interviews
      : interviews.filter((i) => i.status === activeTab);

  const upcoming = interviews.filter((i) => i.status === "UPCOMING");
  const completed = interviews.filter((i) => i.status === "COMPLETED");

  const handleStartInterview = useCallback(
    (_interview: InterviewListItem) => {
      navigate("/hardware");
    },
    [navigate],
  );

  const handleViewResults = useCallback(
    (interview: InterviewListItem) => {
      navigate(`/analysis/${interview.interviewId}`);
    },
    [navigate],
  );

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const res = await interviewsApi.generateQuestions({
        jobTitle: newInterview.jobTitle || newInterview.title,
        instructions: newInterview.instructions || undefined,
        questionCount: newInterview.questionCount || undefined,
      });
      setDraftedQuestions(res.draftedQuestions);
      setCreateStep("questions");
    } catch (error) {
      setDraftedQuestions("");
      setCreateStep("questions");
      alert(
        extractApiError(error).message +
          "\nYou can type your questions manually below.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateInterview = async () => {
    setIsCreating(true);
    try {
      const res = await interviewsApi.createInterview({
        title: newInterview.title,
        durationMinutes: newInterview.durationMinutes,
        toolsEnabled: newInterview.toolsEnabled,
        personaId: newInterview.personaId || undefined,
        generatedQuestions: draftedQuestions || undefined,
        aiInstructions: newInterview.instructions || undefined,
      });
      setCreatedAccessCode(res.accessCode);
      setShowCreateModal(false);
      setNewInterview({
        title: "",
        jobTitle: "",
        instructions: "",
        questionCount: 5,
        personaId: "",
        durationMinutes: 45,
        toolsEnabled: { codeEditor: true, whiteboard: false, notes: true },
      });
      setDraftedQuestions("");
      setCreateStep("info");
      fetchInterviews();
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: interviews.length },
    { key: "UPCOMING", label: "Upcoming", count: upcoming.length },
    { key: "COMPLETED", label: "Completed", count: completed.length },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: interviews.filter((i) => i.status === "CANCELLED").length,
    },
  ];

  return (
    <div className="min-h-screen p-8 lg:p-12 max-w-5xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Interviews</h1>
          <p className="text-slate-500 text-sm">
            Manage your scheduled and past interview sessions.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Interview
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-blue-400">
                schedule
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Upcoming
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{upcoming.length}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-green-400">
                check_circle
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Completed
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{completed.length}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary">
                owl
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{interviews.length}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-[#0d0d0d] p-1 rounded-lg border border-primary/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? "bg-primary/10 text-primary"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 text-[10px] ${activeTab === tab.key ? "text-primary/60" : "text-slate-600"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <span className="material-symbols-outlined text-4xl mb-3 block">
              event_busy
            </span>
            <p className="text-sm font-medium">
              No interviews in this category
            </p>
          </div>
        )}
        {filtered.map((interview) => {
          const cfg =
            STATUS_CONFIG[interview.status] || STATUS_CONFIG["UPCOMING"];
          return (
            <div
              key={interview.interviewId}
              className="bg-[#0d0d0d] border border-primary/10 rounded-xl p-5 flex items-center justify-between hover:border-primary/25 transition-colors group"
            >
              <div className="flex items-center gap-5">
                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <span className="text-primary font-bold text-sm uppercase">
                    {interview.title[0]}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-white">
                      {interview.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-xs">
                        tag
                      </span>
                      {interview.accessCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {interview.status === "UPCOMING" && (
                  <button
                    onClick={() => handleStartInterview(interview)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      play_arrow
                    </span>
                    Start
                  </button>
                )}
                {interview.status === "COMPLETED" && (
                  <button
                    onClick={() => handleViewResults(interview)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      analytics
                    </span>
                    Results
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-primary/20 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                Create New Interview
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {createStep === "info" ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                          Interview Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Backend Engineer"
                          value={newInterview.title}
                          onChange={(e) =>
                            setNewInterview({
                              ...newInterview,
                              title: e.target.value,
                            })
                          }
                          className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={180}
                          value={newInterview.durationMinutes || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNewInterview({
                              ...newInterview,
                              durationMinutes: v === "" ? 0 : parseInt(v),
                            });
                          }}
                          className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                        AI Persona (Optional)
                      </label>
                      <select
                        value={newInterview.personaId}
                        onChange={(e) =>
                          setNewInterview({
                            ...newInterview,
                            personaId: e.target.value,
                          })
                        }
                        className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary appearance-none"
                      >
                        <option value="">Default AI (Owlyn-4)</option>
                        {personas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                        Tools Enabled
                      </label>
                      <div className="flex gap-4">
                        {(["codeEditor", "whiteboard", "notes"] as const).map(
                          (tool) => (
                            <button
                              key={tool}
                              type="button"
                              onClick={() =>
                                setNewInterview({
                                  ...newInterview,
                                  toolsEnabled: {
                                    ...newInterview.toolsEnabled,
                                    [tool]: !newInterview.toolsEnabled[tool],
                                  },
                                })
                              }
                              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${newInterview.toolsEnabled[tool] ? "bg-primary border-primary text-black" : "border-primary/20 text-slate-500 hover:border-primary/40"}`}
                            >
                              {tool.replace(/([A-Z])/g, " $1").trim()}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 border border-primary/10 rounded-xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
                      <span className="material-symbols-outlined text-primary">
                        auto_awesome
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          AI Question Generator
                        </h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                          Powered by Gemini 3.0 Flash
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Senior Java Developer"
                            value={newInterview.jobTitle}
                            onChange={(e) =>
                              setNewInterview({
                                ...newInterview,
                                jobTitle: e.target.value,
                              })
                            }
                            className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-2 px-4"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                            Question Count
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={newInterview.questionCount}
                            onChange={(e) =>
                              setNewInterview({
                                ...newInterview,
                                questionCount: parseInt(e.target.value) || 5,
                              })
                            }
                            className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-2 px-4"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                          AI Instructions (Optional)
                        </label>
                        <textarea
                          placeholder="e.g. Focus heavily on Spring Boot and AOP..."
                          rows={3}
                          value={newInterview.instructions}
                          onChange={(e) =>
                            setNewInterview({
                              ...newInterview,
                              instructions: e.target.value,
                            })
                          }
                          className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                      Review & Edit Questions
                    </h3>
                    <button
                      onClick={() => setCreateStep("info")}
                      className="text-[10px] font-bold text-primary uppercase hover:underline"
                    >
                      Edit Info
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Edit the generated questions below, or write your own from
                    scratch.
                  </p>
                  <textarea
                    value={draftedQuestions}
                    onChange={(e) => setDraftedQuestions(e.target.value)}
                    rows={14}
                    placeholder="1. What is Spring AOP?\n2. How do you secure REST APIs?\n3. ..."
                    className="w-full bg-[#1e1a14]/30 border border-primary/10 rounded-xl text-white text-sm py-4 px-5 focus:ring-primary focus:border-primary resize-none font-mono leading-relaxed"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-primary/10 bg-primary/5 flex gap-4">
              {createStep === "info" ? (
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating || !newInterview.title}
                  className="flex-1 py-4 bg-primary text-black font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10"
                >
                  {isGenerating ? (
                    <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined">
                      auto_awesome
                    </span>
                  )}
                  Generate Questions
                </button>
              ) : (
                <>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating}
                    className="w-14 h-14 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
                    title="Regenerate All"
                  >
                    <span
                      className={`material-symbols-outlined ${isGenerating ? "animate-spin" : ""}`}
                    >
                      refresh
                    </span>
                  </button>
                  <button
                    onClick={handleCreateInterview}
                    disabled={isCreating}
                    className="flex-1 py-4 bg-primary text-black font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10"
                  >
                    {isCreating && (
                      <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    )}
                    Finalize & Create
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {createdAccessCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-primary/20 w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6 border border-green-500/20">
              <span className="material-symbols-outlined text-green-400 text-3xl">
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Interview Created!
            </h3>
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest">
              Copy the access code and send it to the candidate
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6 relative group/code">
              <p className="text-4xl font-bold text-primary font-mono tracking-[0.5em] select-all">
                {createdAccessCode}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdAccessCode);
                  alert("Access code copied to clipboard!");
                }}
                className="absolute top-2 right-2 p-2 text-primary/40 hover:text-primary transition-colors"
                title="Copy to clipboard"
              >
                <span className="material-symbols-outlined text-sm">
                  content_copy
                </span>
              </button>
            </div>
            <button
              onClick={() => setCreatedAccessCode(null)}
              className="w-full py-4 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-xl shadow-primary/10"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
