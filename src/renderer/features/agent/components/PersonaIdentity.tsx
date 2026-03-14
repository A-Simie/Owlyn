import { LANGUAGES } from "../constants";

interface PersonaIdentityProps {
  name: string;
  setName: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  isAdaptive: boolean;
  setIsAdaptive: (v: boolean) => void;
}

export function PersonaIdentity({ 
  name, setName, language, setLanguage, isAdaptive, setIsAdaptive 
}: PersonaIdentityProps) {
  return (
    <section className="glass-panel rounded-3xl p-1 border border-white/5 bg-white/[0.01] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:divide-x divide-white/5">
        <div className="lg:col-span-1 p-8 flex flex-col items-center justify-center relative bg-white/[0.01]">
          <div className="size-24 rounded-full bg-black/40 border border-primary/20 flex items-center justify-center relative shadow-2xl">
            <div className="size-16 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5">
              <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
            </div>
          </div>
          <div className="text-center mt-6">
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] truncate max-w-[120px]">{name || "Unnamed"}</h4>
          </div>
        </div>

        <div className="lg:col-span-3 p-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Deployment Identity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Persona Name</label>
              <input
                type="text"
                placeholder="Enter Persona Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-sm font-bold text-white focus:border-primary/40 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Native Language</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-[11px] font-black text-white uppercase tracking-widest outline-none appearance-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => <option key={lang} value={lang} className="bg-black text-white">{lang.toUpperCase()}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-primary/30 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Response Logic</label>
              <div className="relative">
                <select
                  value={isAdaptive ? "true" : "false"}
                  onChange={(e) => setIsAdaptive(e.target.value === "true")}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-[11px] font-black text-white uppercase tracking-widest outline-none appearance-none cursor-pointer"
                >
                  <option value="true" className="bg-black text-white">ADAPTIVE</option>
                  <option value="false" className="bg-black text-white">FIXED LOGIC</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-primary/30 pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
