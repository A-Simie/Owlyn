import { TONES } from "../constants";

interface PersonaVoiceAccentProps {
  selectedTone: string;
  onSelect: (id: string) => void;
}

export function PersonaVoiceAccent({ selectedTone, onSelect }: PersonaVoiceAccentProps) {
  return (
    <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-3 mb-8">
         <span className="material-symbols-outlined text-primary text-xl">record_voice_over</span>
         <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Voice Accent</h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {TONES.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onSelect(tone.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedTone === tone.id ? "bg-primary/10 border-primary/40" : "bg-white/5 border-white/5 hover:border-primary/20"}`}
          >
            <span className={`material-symbols-outlined text-2xl ${selectedTone === tone.id ? "text-primary" : "text-slate-500"}`}>{tone.icon}</span>
            <div>
              <p className="text-white text-[11px] font-black uppercase tracking-widest">{tone.label}</p>
              <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">{tone.desc}</p>
            </div>
            {selectedTone === tone.id && <span className="material-symbols-outlined text-primary text-sm ml-auto">check_circle</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
