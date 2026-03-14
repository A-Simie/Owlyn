import type { Persona } from "@shared/schemas/persona.schema";

interface CreateInterviewModalProps {
  onClose: () => void;
  step: "info" | "questions";
  setStep: (s: "info" | "questions") => void;
  newInterview: any;
  setNewInterview: (v: any) => void;
  personas: Persona[];
  draftedQuestions: string;
  setDraftedQuestions: (v: string) => void;
  isGenerating: boolean;
  isCreating: boolean;
  onGenerate: () => void;
  onCreate: () => void;
}

export function CreateInterviewModal({
  onClose, step, setStep, newInterview, setNewInterview, personas,
  draftedQuestions, setDraftedQuestions, isGenerating, isCreating, onGenerate, onCreate
}: CreateInterviewModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d0d0d] border border-primary/20 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Create New Interview</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === "info" ? (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Candidate Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={newInterview.candidateName} onChange={(e) => setNewInterview({ ...newInterview, candidateName: e.target.value })} className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Candidate Email</label>
                  <input type="email" placeholder="e.g. john@example.com" value={newInterview.candidateEmail} onChange={(e) => setNewInterview({ ...newInterview, candidateEmail: e.target.value })} className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px) font-bold text-primary uppercase tracking-widest ml-1">Interview Title</label>
                  <input type="text" placeholder="e.g. Senior Backend Engineer" value={newInterview.title} onChange={(e) => setNewInterview({ ...newInterview, title: e.target.value })} className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Duration (min)</label>
                  <input type="number" min={5} max={30} value={newInterview.durationMinutes || ""} onChange={(e) => setNewInterview({ ...newInterview, durationMinutes: e.target.value === "" ? 0 : parseInt(e.target.value) })} className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-2 px-4 focus:ring-primary focus:border-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">AI Persona (Optional)</label>
                <select value={newInterview.personaId} onChange={(e) => setNewInterview({ ...newInterview, personaId: e.target.value })} className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary appearance-none">
                  <option value="">Default AI (Owlyn)</option>
                  {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Interface Tools</label>
                <div className="flex gap-4">
                  {(["codeEditor", "whiteboard", "notes"] as const).map(tool => (
                    <button key={tool} type="button" onClick={() => setNewInterview({ ...newInterview, toolsEnabled: { ...newInterview.toolsEnabled, [tool]: !newInterview.toolsEnabled[tool] } })} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${newInterview.toolsEnabled[tool] ? "bg-primary border-primary text-black" : "border-primary/20 text-slate-500 hover:border-primary/40"}`}>
                      {tool === "codeEditor" ? "Code" : tool === "whiteboard" ? "Whiteboard" : "Notes"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Job Title</label>
                    <input type="text" placeholder="e.g. Senior Java Developer" value={newInterview.jobTitle} onChange={(e) => setNewInterview({ ...newInterview, jobTitle: e.target.value })} className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-2 px-4" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Question Count</label>
                    <input type="number" min={1} max={20} value={newInterview.questionCount || ""} onChange={(e) => setNewInterview({ ...newInterview, questionCount: e.target.value === "" ? 0 : parseInt(e.target.value) })} className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-2 px-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">AI Instructions (Optional)</label>
                  <textarea placeholder="e.g. Focus heavily on Spring Boot..." rows={3} value={newInterview.instructions} onChange={(e) => setNewInterview({ ...newInterview, instructions: e.target.value })} className="w-full bg-[#0d0d0d] border border-primary/10 rounded-lg text-white text-sm py-3 px-4 focus:ring-primary focus:border-primary resize-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Review & Edit Questions</h3>
                <button onClick={() => setStep("info")} className="text-[10px] font-bold text-primary uppercase hover:underline">Edit Info</button>
              </div>
              <textarea value={draftedQuestions} onChange={(e) => setDraftedQuestions(e.target.value)} rows={14} placeholder="1. ..." className="w-full bg-[#1e1a14]/30 border border-primary/10 rounded-xl text-white text-sm py-4 px-5 focus:ring-primary focus:border-primary resize-none font-mono leading-relaxed" />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-primary/10 bg-primary/5 flex gap-4">
          <button
            onClick={step === "info" ? onGenerate : onCreate}
            disabled={isGenerating || isCreating || (step === "info" && (!newInterview.title || !newInterview.candidateName || !newInterview.candidateEmail))}
            className="flex-1 py-4 bg-primary text-black font-bold uppercase tracking-[0.2em] rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {(isGenerating || isCreating) ? <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <span className="material-symbols-outlined">{step === "info" ? "auto_awesome" : "check_circle"}</span>}
            {step === "info" ? "Generate Questions" : "Finalize & Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
