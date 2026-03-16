import { useState } from "react";
import { DOMAINS_LIST } from "../constants";

interface PersonaSkillDomainsProps {
  selectedDomains: string[];
  onToggle: (label: string) => void;
  onAddCustom: (label: string) => void;
}

export function PersonaSkillDomains({ selectedDomains, onToggle, onAddCustom }: PersonaSkillDomainsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [custom, setCustom] = useState("");

  const handleAdd = () => {
    if (custom.trim()) {
      onAddCustom(custom.trim());
      setCustom("");
      setIsAdding(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">terminal</span>
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Skill Domains</h3>
         </div>
         <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{selectedDomains.length} Domains added</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from(new Set([...DOMAINS_LIST, ...selectedDomains])).map((label) => {
          const isActive = selectedDomains.includes(label);
          return (
            <button
              key={label}
              onClick={() => onToggle(label)}
              className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${isActive ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/3 text-slate-500 hover:border-primary/20"}`}
            >
              {label}
            </button>
          );
        })}
        {isAdding ? (
          <input
            autoFocus
            type="text"
            placeholder="..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setIsAdding(false); }}
            className="bg-white/5 border border-primary/30 rounded-lg text-[9px] font-black uppercase tracking-widest px-4 py-2 text-white w-28 outline-none"
          />
        ) : (
          <button onClick={() => setIsAdding(true)} className="px-5 py-2 bg-primary/5 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/10 transition-all">+ Add</button>
        )}
      </div>
    </div>
  );
}
