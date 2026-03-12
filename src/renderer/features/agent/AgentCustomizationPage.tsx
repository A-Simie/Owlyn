import { useState, useEffect, useCallback } from "react";
import { personasApi } from "@/api/personas.api";
import { extractApiError } from "@/lib/api-error";
import type { Persona } from "@shared/schemas/persona.schema";

const TONES = [
  {
    id: "mentor",
    icon: "school",
    label: "Mentor",
    desc: "Encouraging & Guidance",
  },
  {
    id: "architect",
    icon: "architecture",
    label: "Architect",
    desc: "Logical & Structural",
  },
  {
    id: "inquisitor",
    icon: "search_insights",
    label: "Inquisitor",
    desc: "Direct & Probing",
  },
];

const DOMAINS_LIST = [
  "Kubernetes",
  "React Architecture",
  "Cloud Security",
  "Go Lang",
  "Redis",
  "Node.js",
  "Python",
  "System Design",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
];

export default function AgentCustomizationPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isAdaptive, setIsAdaptive] = useState(true);

  const [sliders, setSliders] = useState({
    strictness: 75,
    analytical: 90,
    collaborative: 60,
  });
  const [selectedTone, setSelectedTone] = useState("mentor");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["Kubernetes", "Go Lang"]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [status, setStatus] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await personasApi.getPersonas();
      setPersonas(data);
    } catch (error) {
      console.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const handleAddCustomDomain = () => {
    const trimmed = customDomain.trim();
    if (trimmed && !selectedDomains.includes(trimmed)) {
      setSelectedDomains([...selectedDomains, trimmed]);
      setCustomDomain("");
      setIsAddingDomain(false);
    }
  };

  const toggleDomain = (label: string) => {
    if (selectedDomains.includes(label)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== label));
    } else {
      setSelectedDomains([...selectedDomains, label]);
    }
  };

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 3000);
  };

  const resetForm = () => {
    setName("");
    setRoleTitle("");
    setContextFiles([]);
    setSelectedPersona(null);
    setSliders({
      strictness: 75,
      analytical: 90,
      collaborative: 60,
    });
    setSelectedTone("mentor");
    setSelectedDomains(["Kubernetes", "Go Lang"]);
    setSelectedLanguage("English");
    setIsAdaptive(true);
  };

  const handleSliderChange = (key: keyof typeof sliders, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (persona: Persona) => {
    setSelectedPersona(persona);
    setName(persona.name);
    setRoleTitle(persona.roleTitle || "");
    setSliders({
      strictness: 100 - (persona.empathyScore || 50),
      analytical: persona.analyticalDepth || 90,
      collaborative: 100 - (persona.directnessScore || 50),
    });
    setSelectedTone((persona.tone?.toLowerCase() as any) || "mentor");
    setSelectedDomains(persona.domainExpertise || []);
    setSelectedLanguage(persona.language || "English");
    setIsAdaptive(persona.isAdaptive ?? true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this persona?")) return;
    try {
      await personasApi.deletePersona(id);
      setPersonas(personas.filter((p) => p.id !== id));
      if (selectedPersona?.id === id) resetForm();
      showStatus("Persona deleted.");
    } catch (error) {
      showStatus(extractApiError(error).message, "error");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showStatus("Persona name is required.", "error");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const personaData = {
        name,
        roleTitle: roleTitle,
        empathyScore: 100 - sliders.strictness,
        analyticalDepth: sliders.analytical,
        directnessScore: 100 - sliders.collaborative,
        tone: selectedTone.toUpperCase(),
        domainExpertise: selectedDomains,
        language: selectedLanguage,
        isAdaptive,
      };

      const fd = new FormData();
      fd.append("persona", new Blob([JSON.stringify(personaData)], { type: "application/json" }));
      if (contextFiles.length > 0) fd.append("file", contextFiles[0]);

      if (selectedPersona) {
        await personasApi.updatePersona(selectedPersona.id, fd);
        showStatus("Persona updated successfully.");
      } else {
        await personasApi.createPersona(fd);
        showStatus("Persona saved successfully.");
      }
      
      fetchPersonas();
      resetForm();
    } catch (error) {
      showStatus(extractApiError(error).message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b divider flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-heading text-lg font-bold tracking-tight">Agent Configuration</h2>
              <p className="text-subtle text-xs uppercase tracking-widest">Persona Settings</p>
            </div>
            {status && (
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 ${status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {status.text}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={resetForm} className="px-6 py-2 bg-white/5 border border-white/10 text-subtle text-[10px] uppercase font-black tracking-widest rounded-lg hover:bg-white/10 transition-all">
              New Persona
            </button>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <button onClick={handleSave} disabled={isSaving} className="bg-primary text-black px-8 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:scale-95 transition-all">
              {isSaving && <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {isSaving ? "Processing..." : selectedPersona ? "Update Persona" : "Deploy Persona"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Library Section */}
            {personas.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Your Persona Library</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar scroll-smooth">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleEdit(p)}
                      className={`flex-shrink-0 w-64 p-5 rounded-xl border transition-all text-left relative group ${selectedPersona?.id === p.id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10 hover:border-primary/30"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="size-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
                          <span 
                            className="material-symbols-outlined text-primary text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            owl
                          </span>
                        </div>
                        <span onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="material-symbols-outlined text-sm text-red-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          delete
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate mt-0.5">{p.language} · {p.tone}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-8">
                {/* Visual Preview */}
                <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group border border-white/5 bg-white/[0.02]">
                  <div className="relative z-10 py-4">
                    <div className="size-40 rounded-full bg-black/40 border border-primary/10 flex items-center justify-center relative shadow-2xl">
                      <div className="size-28 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5 animate-pulse-slow">
                        <span 
                          className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          owl
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center z-10 mt-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">{name || "Unnamed"}</h4>
                    <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest mt-1">{roleTitle || "AI Agent"}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-10">
                {/* Core Identity */}
                <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
                   <div className="flex items-center gap-3 mb-10">
                      <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
                      <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Identity & Behavior</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Persona Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Master Mentor"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-sm font-bold text-white focus:border-primary/40 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Role Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Lead System Evaluator"
                            value={roleTitle}
                            onChange={(e) => setRoleTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-5 text-sm font-bold text-white focus:border-primary/40 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Native Language</label>
                          <div className="relative group">
                            <select
                              value={selectedLanguage}
                              onChange={(e) => setSelectedLanguage(e.target.value)}
                              className="w-full h-[46px] bg-white/5 border border-white/5 rounded-xl px-5 text-[11px] font-black text-white uppercase tracking-widest focus:border-primary/40 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
                            >
                              {LANGUAGES.map(lang => <option key={lang} value={lang} className="bg-obsidian text-white">{lang.toUpperCase()}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-primary/30 pointer-events-none group-hover:text-primary transition-colors">expand_more</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Processing Mode</label>
                          <button
                            onClick={() => setIsAdaptive(!isAdaptive)}
                            className={`w-full h-[46px] px-5 rounded-xl border transition-all flex items-center justify-between group ${isAdaptive ? "bg-primary/5 border-primary/20 text-primary" : "bg-white/5 border-white/5 text-slate-500"}`}
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest">{isAdaptive ? "Adaptive AI" : "Fixed Logic"}</span>
                            <span className={`material-symbols-outlined text-lg ${isAdaptive ? "text-primary" : "text-slate-600"} group-hover:scale-110 transition-transform`}>{isAdaptive ? "psychology" : "psychology_alt"}</span>
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
                {/* Personality Sliders */}
                <div className="glass-panel rounded-2xl p-8 border border-white/5">
                   <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">tune</span>
                      <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Personality Matrix</h3>
                    </div>
                  </div>
                  <div className="space-y-10">
                    {[
                      { left: "Empathy", right: `Strictness (${sliders.strictness}%)`, value: sliders.strictness, key: "strictness" as const, leftLabel: "SUPPORTIVE", rightLabel: "CHALLENGING" },
                      { left: `Analytical Depth (${sliders.analytical}%)`, right: "Cultural Fit", value: sliders.analytical, key: "analytical" as const, leftLabel: "TECHNICAL", rightLabel: "BEHAVIORAL" },
                      { left: "Directness", right: `Collaborative (${sliders.collaborative}%)`, value: sliders.collaborative, key: "collaborative" as const, leftLabel: "CONCISE", rightLabel: "ENGAGING" },
                    ].map((slider) => (
                      <div key={slider.key} className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className={slider.value < 50 ? "text-primary" : "text-slate-500"}>{slider.left}</span>
                          <span className={slider.value >= 50 ? "text-primary" : "text-slate-500"}>{slider.right}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={slider.value}
                          onChange={(e) => handleSliderChange(slider.key, parseInt(e.target.value))}
                          className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary-bright transition-all"
                        />
                        <div className="flex justify-between text-[9px] text-slate-600 font-bold tracking-widest">
                          <span>{slider.leftLabel}</span>
                          <span>{slider.rightLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tone of Voice */}
                  <div className="glass-panel rounded-2xl p-8 border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                       <span className="material-symbols-outlined text-primary text-xl">record_voice_over</span>
                       <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Vocal Tone</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {TONES.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setSelectedTone(tone.id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedTone === tone.id ? "bg-primary/10 border-primary/40" : "bg-white/5 border-white/10 hover:border-primary/20"}`}
                        >
                          <span className={`material-symbols-outlined text-2xl ${selectedTone === tone.id ? "text-primary" : "text-slate-500"}`}>{tone.icon}</span>
                          <div>
                            <p className="text-white text-xs font-black uppercase tracking-widest">{tone.label}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{tone.desc}</p>
                          </div>
                          {selectedTone === tone.id && <span className="material-symbols-outlined text-primary text-sm ml-auto">check_circle</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Domain Expertise */}
                  <div className="glass-panel rounded-2xl p-8 border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                       <span className="material-symbols-outlined text-primary text-xl">terminal</span>
                       <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Expertise</h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {Array.from(new Set([...DOMAINS_LIST, ...selectedDomains])).map((label) => {
                        const isActive = selectedDomains.includes(label);
                        return (
                          <button
                            key={label}
                            onClick={() => toggleDomain(label)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${isActive ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-slate-500 hover:border-primary/20"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                      {isAddingDomain ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="..."
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomDomain(); if (e.key === "Escape") setIsAddingDomain(false); }}
                            className="bg-white/10 border border-primary/30 rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-2 text-white w-24 outline-none focus:border-primary"
                          />
                        </div>
                      ) : (
                        <button onClick={() => setIsAddingDomain(true)} className="px-4 py-2 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/10 transition-all">+ Add</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
