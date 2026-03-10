import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  const [description, setDescription] = useState("");
  const [voiceId, setVoiceId] = useState("Aries");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isAdaptive, setIsAdaptive] = useState(true);

  const [sliders, setSliders] = useState({
    strictness: 75,
    analytical: 90,
    collaborative: 60,
  });
  const [selectedTone, setSelectedTone] = useState("mentor");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    "Kubernetes",
    "Go Lang",
  ]);
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
        roleTitle: description,
        empathyScore: 100 - sliders.strictness,
        analyticalDepth: sliders.analytical,
        directnessScore: 100 - sliders.collaborative,
        tone: selectedTone.toUpperCase(),
        domainExpertise: selectedDomains,
        language: selectedLanguage,
        isAdaptive,
      };
      const fd = new FormData();
      fd.append(
        "persona",
        new Blob([JSON.stringify(personaData)], { type: "application/json" }),
      );
      if (contextFiles.length > 0) fd.append("file", contextFiles[0]);

      await personasApi.createPersona(fd);
      showStatus("Persona saved successfully.");
      fetchPersonas();
      setName("");
      setDescription("");
      setAvatarFile(null);
      setContextFiles([]);
    } catch (error) {
      showStatus(extractApiError(error).message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // If there's no custom modal system, we use confirm for high-stakes actions but defined in handler
    if (
      !window.confirm(
        "Are you sure you want to delete this persona? This action cannot be undone.",
      )
    )
      return;
    try {
      await personasApi.deletePersona(id);
      setPersonas(personas.filter((p) => p.id !== id));
      showStatus("Persona deleted.");
    } catch (error) {
      showStatus(extractApiError(error).message, "error");
    }
  };

  const handleSliderChange = (key: keyof typeof sliders, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleContextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setContextFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeContextFile = (idx: number) => {
    setContextFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-hidden">
      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b divider flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-heading text-lg font-bold tracking-tight">
                Agent Configuration
              </h2>
              <p className="text-subtle text-xs uppercase tracking-widest">
                Persona Settings ·
              </p>
            </div>
            {status && (
              <div
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 ${status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
              >
                {status.text}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg h-10 px-4 focus-within:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-sm text-primary mr-3">
                fingerprint
              </span>
              <input
                type="text"
                placeholder="Name your Persona..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-heading text-sm font-bold focus:ring-0 p-0 w-48 placeholder:text-slate-500"
              />
            </div>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <button className="px-4 py-2 text-muted hover:text-heading text-sm font-medium">
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-black px-8 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:scale-95 transition-all"
            >
              {isSaving && (
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
              {isSaving ? "Processing..." : "Deploy Persona"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Hero */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 glass-panel rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="relative z-10 py-6">
                  <div className="size-48 rounded-full bg-slate-50 dark:bg-charcoal border border-slate-200 dark:border-primary/20 flex items-center justify-center pulse-ring">
                    <div className="size-32 rounded-full border border-slate-200 dark:border-primary/40 flex items-center justify-center">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">
                          grain
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4 z-10 w-full space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">
                      {name || "Unnamed Persona"}
                    </p>
                    <input
                      type="text"
                      placeholder="Title | e.g. Senior Evaluator"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-500 text-[10px] tracking-widest uppercase text-center focus:ring-0 p-0 placeholder:text-slate-800"
                    />
                  </div>
                  <div className="h-px w-12 bg-white/10 mx-auto" />

                  <div className="w-full pt-2">
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mb-3 text-center w-full">
                      Persona Settings
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      {/* Language Selection */}
                      <div className="relative group/lang flex flex-col items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 hover:bg-slate-200 dark:hover:bg-white/10 transition-all focus-within:border-primary/50">
                        <span className="material-symbols-outlined text-[18px] text-primary/70 group-hover/lang:text-primary mb-1.5 transition-colors">
                          translate
                        </span>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full bg-transparent text-center text-[10px] font-black text-heading uppercase tracking-[0.15em] border-none focus:ring-0 p-0 cursor-pointer outline-none appearance-none z-10"
                        >
                          {LANGUAGES.map((lang) => (
                            <option
                              key={lang}
                              value={lang}
                              className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 font-sans normal-case tracking-normal text-sm text-center"
                            >
                              {lang}
                            </option>
                          ))}
                        </select>
                        <span className="text-[7px] text-subtle uppercase tracking-[0.2em] font-bold mt-1">
                          Language
                        </span>
                      </div>

                      {/* Adaptive Toggle */}
                      <button
                        onClick={() => setIsAdaptive(!isAdaptive)}
                        className="relative group/adapt flex flex-col items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 hover:bg-slate-200 dark:hover:bg-white/10 transition-all outline-none"
                      >
                        <span className={`material-symbols-outlined text-[18px] mb-1.5 transition-colors ${isAdaptive ? "text-primary" : "text-primary/30 group-hover/adapt:text-primary/70"}`}>
                          psychology
                        </span>
                        <span className="text-[10px] font-black text-heading uppercase tracking-[0.15em]">
                          {isAdaptive ? "TRUE" : "FALSE"}
                        </span>
                        <span className="text-[7px] text-subtle uppercase tracking-[0.2em] font-bold mt-1">
                          Adaptive
                        </span>
                        <div className={`absolute inset-0 border rounded-2xl transition-colors pointer-events-none ${isAdaptive ? "border-primary/30" : "border-primary/0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-24 -right-24 size-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 size-48 bg-primary/5 rounded-full blur-3xl" />
              </div>

              {/* Sliders */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel rounded-xl p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-heading font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
                      <span className="material-symbols-outlined text-primary text-lg">
                        tune
                      </span>
                      Persona Personality
                    </h3>
                    <span className="text-[10px] text-subtle uppercase tracking-widest">
                      Fine-tune the AI's behavior and response style
                    </span>
                  </div>
                  <div className="space-y-8">
                    {[
                      {
                        left: "Empathy",
                        right: `Strictness (${sliders.strictness}%)`,
                        value: sliders.strictness,
                        key: "strictness" as const,
                        leftLabel: "SUPPORTIVE",
                        rightLabel: "CHALLENGING",
                      },
                      {
                        left: `Analytical Depth (${sliders.analytical}%)`,
                        right: "Soft Skills Focus",
                        value: sliders.analytical,
                        key: "analytical" as const,
                        leftLabel: "DATA DRIVEN",
                        rightLabel: "CULTURE ORIENTED",
                      },
                      {
                        left: "Directness",
                        right: `Collaborative (${sliders.collaborative}%)`,
                        value: sliders.collaborative,
                        key: "collaborative" as const,
                        leftLabel: "CONCISE",
                        rightLabel: "ELABORATIVE",
                      },
                    ].map((slider) => (
                      <div key={slider.key} className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span
                            className={
                              slider.key === "analytical"
                                ? "text-primary"
                                : "text-muted"
                            }
                          >
                            {slider.left}
                          </span>
                          <span
                            className={
                              slider.key === "analytical"
                                ? "text-muted"
                                : "text-primary"
                            }
                          >
                            {slider.right}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={slider.value}
                          onChange={(e) =>
                            handleSliderChange(
                              slider.key,
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full h-1 bg-slate-100 dark:bg-charcoal rounded-full appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-subtle font-medium">
                          <span>{slider.leftLabel}</span>
                          <span>{slider.rightLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Tone & Knowledge */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">
                    record_voice_over
                  </span>
                  <h3 className="text-heading font-bold uppercase tracking-widest text-sm">
                    Tone of Voice
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-4 rounded-lg text-center transition-all group ${selectedTone === tone.id ? "bg-primary/10 border border-primary/40" : "surface-elevated hover:border-primary/20"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform ${selectedTone === tone.id ? "text-primary" : "text-muted"}`}
                      >
                        {tone.icon}
                      </span>
                      <p className="text-heading text-xs font-bold uppercase mb-1">
                        {tone.label}
                      </p>
                      <p className="text-subtle text-[10px]">{tone.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      database
                    </span>
                    <h3 className="text-heading font-bold uppercase tracking-widest text-sm">
                      Knowledge Base
                    </h3>
                  </div>
                  <button className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">
                    Add Source
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  {contextFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between surface-elevated p-3 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-muted">
                          description
                        </span>
                        <div>
                          <p className="text-heading text-xs font-medium">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-subtle uppercase">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeContextFile(idx)}
                        className="text-subtle hover:text-red-400"
                      >
                        <span className="material-symbols-outlined text-sm">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                  <label className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded mt-2 group cursor-pointer hover:border-primary/20 transition-colors py-8">
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={handleContextFileChange}
                    />
                    <div className="text-center">
                      <span className="material-symbols-outlined text-subtle mb-1 group-hover:text-primary transition-colors">
                        upload_file
                      </span>
                      <p className="text-subtle text-[10px] uppercase font-bold tracking-widest">
                        Select context files
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* Domain Chips */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">
                  terminal
                </span>
                <h3 className="text-heading font-bold uppercase tracking-widest text-sm">
                  Domain Expertise
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {Array.from(new Set([...DOMAINS_LIST, ...selectedDomains])).map(
                  (label) => {
                    const isActive = selectedDomains.includes(label);
                    return (
                      <span
                        key={label}
                        onClick={() => toggleDomain(label)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-2 cursor-pointer transition-all ${isActive ? "bg-primary/20 border border-primary/40 text-primary" : "surface-elevated text-body hover:border-primary/40"}`}
                      >
                        {label}{" "}
                        {isActive && (
                          <span className="material-symbols-outlined text-[14px]">
                            check_circle
                          </span>
                        )}
                      </span>
                    );
                  },
                )}
                {isAddingDomain ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter skill..."
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCustomDomain();
                        if (e.key === "Escape") setIsAddingDomain(false);
                      }}
                      className="bg-[#1e1a14]/30 border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider px-4 py-2 text-white placeholder:text-slate-600 outline-none focus:border-primary/50 w-32 transition-all"
                    />
                    <button
                      onClick={handleAddCustomDomain}
                      className="p-1.5 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        check
                      </span>
                    </button>
                    <button
                      onClick={() => setIsAddingDomain(false)}
                      className="p-1.5 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        close
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingDomain(true)}
                    className="px-4 py-2 surface-elevated text-subtle text-xs font-bold uppercase tracking-wider rounded-full hover:border-primary/20 transition-colors"
                  >
                    + Add Custom
                  </button>
                )}
              </div>
            </section>

            {/* Active Intelligence Feedback */}
            <section className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-10 flex items-center justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="flex items-center gap-8 relative z-10">
                <div className="size-20 bg-[#0B0B0B] rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl group-hover:border-primary/50 transition-all">
                  <div className="flex pb-1 gap-1">
                    {[12, 18, 14, 22].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-primary rounded-full"
                        animate={{ height: [h, h * 1.5, h] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-1">
                    Vocal Synthesis Interface
                  </h4>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    AI standard neutral masculina · dynamic range enabled
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="text-right">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                    Audio Status
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Ready for broadcast
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-white/10 transition-all active:scale-95">
                  Test Module
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
