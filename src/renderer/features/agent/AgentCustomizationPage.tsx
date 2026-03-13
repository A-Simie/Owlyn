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
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isAdaptive, setIsAdaptive] = useState(true);

  const [sliders, setSliders] = useState({
    empathy: 50,
    analytical: 50,
    directness: 50,
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
    setContextFiles([]);
    setSelectedPersona(null);
    setSliders({
      empathy: 50,
      analytical: 50,
      directness: 50,
    });
    setSelectedTone("mentor");
    setSelectedDomains(["Kubernetes", "Go Lang"]);
    setSelectedLanguage("English");
    setIsAdaptive(true);
  };

  const handleSliderChange = (key: keyof typeof sliders, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleKnowledgeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setContextFiles([file]);
  };

  const handleEdit = (persona: Persona) => {
    setSelectedPersona(persona);
    setName(persona.name);
    setSliders({
      empathy: persona.empathyScore || 50,
      analytical: persona.analyticalDepth || 90,
      directness: persona.directnessScore || 50,
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
        empathyScore: sliders.empathy,
        analyticalDepth: sliders.analytical,
        directnessScore: sliders.directness,
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
                      onClick={() => handleEdit(p)}
                      className={`flex-shrink-0 w-72 p-6 rounded-2xl border transition-all text-left relative group snap-start snap-always shadow-xl cursor-pointer ${selectedPersona?.id === p.id ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "bg-white/[0.02] border-white/5 hover:border-primary/30"}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                          <span 
                            className="material-symbols-outlined text-primary text-xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            owl
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="size-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-xs font-bold">edit</span>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="size-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-500 transition-colors">
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

            {/* Configuration Section */}
            <div className="space-y-10 pb-20">
              {/* Core Identity & Processing */}
              <section className="glass-panel rounded-3xl p-1 border border-white/5 bg-white/[0.01] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:divide-x divide-white/5">
                  <div className="lg:col-span-1 p-8 flex flex-col items-center justify-center relative bg-white/[0.01]">
                    <div className="size-24 rounded-full bg-black/40 border border-primary/20 flex items-center justify-center relative shadow-2xl">
                      <div className="size-16 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5 animate-pulse-slow">
                        <span 
                          className="material-symbols-outlined text-4xl text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          owl
                        </span>
                      </div>
                    </div>
                    <div className="text-center mt-6">
                      <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] truncate max-w-[120px]">{name || "Unnamed"}</h4>
                    </div>
                  </div>

                  <div className="lg:col-span-3 p-8">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
                          <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Deployment Identity</h3>
                       </div>
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
                        <div className="relative group">
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-[11px] font-black text-white uppercase tracking-widest focus:border-primary/40 outline-none appearance-none cursor-pointer"
                          >
                            {LANGUAGES.map(lang => <option key={lang} value={lang} className="bg-obsidian text-white">{lang.toUpperCase()}</option>)}
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-primary/30 pointer-events-none">expand_more</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Response Logic</label>
                        <div className="relative group">
                          <select
                            value={isAdaptive ? "true" : "false"}
                            onChange={(e) => setIsAdaptive(e.target.value === "true")}
                            className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-[11px] font-black text-white uppercase tracking-widest focus:border-primary/40 outline-none appearance-none cursor-pointer"
                          >
                            <option value="true" className="bg-obsidian text-white">ADAPTIVE</option>
                            <option value="false" className="bg-obsidian text-white">FIXED LOGIC</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-lg text-primary/30 pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

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
                    {contextFiles.length > 0 ? "Replace File" : "Upload File"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleKnowledgeFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                    {contextFiles.length > 0
                      ? contextFiles[0].name
                      : selectedPersona?.hasKnowledgeBase
                        ? "Existing knowledge base attached"
                        : "No file selected"}
                  </span>
                </div>
              </section>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Matrix Card */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-3 mb-10">
                    <span className="material-symbols-outlined text-primary text-xl">tune</span>
                    <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Personality Matrix</h3>
                  </div>
                  <div className="space-y-12">
                    {[
                      { left: "Strictness", right: "Empathy", value: sliders.empathy, key: "empathy" as const, leftLabel: "CHALLENGING", rightLabel: "SUPPORTIVE" },
                      { left: "Cultural Fit", right: "Analytical Depth", value: sliders.analytical, key: "analytical" as const, leftLabel: "BEHAVIORAL", rightLabel: "TECHNICAL" },
                      { left: "Collaboration", right: "Directness", value: sliders.directness, key: "directness" as const, leftLabel: "ENGAGING", rightLabel: "CONCISE" },
                    ].map((slider) => (
                      <div key={slider.key} className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className={slider.value < 50 ? "text-primary" : "text-slate-500"}>{slider.left}</span>
                          <span className={slider.value >= 50 ? "text-primary transition-all" : "text-slate-500"}>{slider.right}</span>
                        </div>
                        <div className="relative pt-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={slider.value}
                            onChange={(e) => handleSliderChange(slider.key, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 font-bold tracking-[0.2em]">
                          <span>{slider.leftLabel}</span>
                          <span>{slider.value}% {slider.right}</span>
                          <span>{slider.rightLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice Accent */}
                <div className="lg:col-span-1 glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-3 mb-8">
                     <span className="material-symbols-outlined text-primary text-xl">record_voice_over</span>
                     <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Voice Accent</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {TONES.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setSelectedTone(tone.id)}
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
              </div>

              {/* Skill Domains Card  */}
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
                        onClick={() => toggleDomain(label)}
                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${isActive ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/3 text-slate-500 hover:border-primary/20"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                  {isAddingDomain ? (
                    <input
                      autoFocus
                      type="text"
                      placeholder="..."
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomDomain(); if (e.key === "Escape") setIsAddingDomain(false); }}
                      className="bg-white/5 border border-primary/30 rounded-lg text-[9px] font-black uppercase tracking-widest px-4 py-2 text-white w-28 outline-none"
                    />
                  ) : (
                    <button onClick={() => setIsAddingDomain(true)} className="px-5 py-2 bg-primary/5 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/10 transition-all">+ Add</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
