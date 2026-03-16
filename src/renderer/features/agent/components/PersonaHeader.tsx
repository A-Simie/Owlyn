interface PersonaHeaderProps {
  status: { text: string; type: "success" | "error" } | null;
  isSaving: boolean;
  isEditMode: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function PersonaHeader({ status, isSaving, isEditMode, onReset, onSave }: PersonaHeaderProps) {
  return (
    <header className="h-16 border-b divider flex items-center justify-between px-8 bg-white/80 dark:bg-[#0B0B0B]/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-heading text-lg font-bold tracking-tight">Agent Configuration</h2>
          <p className="text-subtle text-xs uppercase tracking-widest">Persona Settings</p>
        </div>
        {status && (
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2 ${status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
            {status.text}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onReset} className="px-6 py-2 bg-white/5 border border-white/10 text-subtle text-[10px] uppercase font-black tracking-widest rounded-lg hover:bg-white/10 transition-all">
          New Persona
        </button>
        <div className="h-6 w-px bg-white/10 mx-2" />
        <button onClick={onSave} disabled={isSaving} className="bg-primary text-black px-8 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-3 active:scale-95 transition-all">
          {isSaving && <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {isSaving ? "Processing..." : isEditMode ? "Update Persona" : "Deploy Persona"}
        </button>
      </div>
    </header>
  );
}
