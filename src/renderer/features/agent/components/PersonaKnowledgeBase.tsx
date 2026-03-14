interface PersonaKnowledgeBaseProps {
  files: File[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasExistingKnowledge?: boolean;
}

export function PersonaKnowledgeBase({ files, onChange, hasExistingKnowledge }: PersonaKnowledgeBaseProps) {
  return (
    <section className="glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
          <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Knowledge Base</h3>
        </div>
        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Optional</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-200 cursor-pointer hover:border-primary/30 transition-all">
          <span className="material-symbols-outlined text-sm">attach_file</span>
          {files.length > 0 ? "Replace File" : "Upload File"}
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={onChange} className="hidden" />
        </label>

        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
          {files.length > 0 ? files[0].name : hasExistingKnowledge ? "Existing knowledge base attached" : "No file selected"}
        </span>
      </div>
    </section>
  );
}
