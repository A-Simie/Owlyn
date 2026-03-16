import type { Persona } from "@shared/schemas/persona.schema";

interface PersonaLibraryProps {
  personas: Persona[];
  selectedId?: string;
  onEdit: (p: Persona) => void;
  onDelete: (id: string) => void;
}

export function PersonaLibrary({ personas, selectedId, onEdit, onDelete }: PersonaLibraryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Your Persona Library</h3>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{personas.length} Saved Agents</span>
      </div>
      
      {personas.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar scroll-smooth snap-x snap-mandatory">
          {personas.map((p) => (
            <div
              key={p.id}
              onClick={() => onEdit(p)}
              className={`flex-shrink-0 w-72 p-6 rounded-2xl border transition-all text-left relative group snap-start snap-always shadow-xl cursor-pointer ${selectedId === p.id ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "bg-white/[0.02] border-white/5 hover:border-primary/30"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="size-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="size-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xs font-bold">edit</span>
                   </button>
                   <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="size-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-xs font-bold">delete</span>
                   </button>
                </div>
              </div>
              <p className="text-sm font-black text-white truncate uppercase tracking-tight">{p.name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                 <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.language}</span>
                 <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.tone}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-32 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center space-y-2 group hover:border-primary/20 transition-all">
          <span className="material-symbols-outlined text-primary/20 text-3xl group-hover:scale-110 transition-transform duration-500">add_circle</span>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No personas deployed yet</p>
        </div>
      )}
    </section>
  );
}
