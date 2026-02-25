
import { useState } from 'react'


const TONES = [
    { id: 'mentor', icon: 'school', label: 'Mentor', desc: 'Encouraging & Guidance' },
    { id: 'architect', icon: 'architecture', label: 'Architect', desc: 'Logical & Structural' },
    { id: 'inquisitor', icon: 'search_insights', label: 'Inquisitor', desc: 'Direct & Probing' },
]

const DOMAINS = [
    { label: 'Kubernetes', active: true },
    { label: 'React Architecture', active: false },
    { label: 'Cloud Security', active: false },
    { label: 'Go Lang', active: true },
    { label: 'Redis', active: false },
]

export default function AgentCustomizationPage() {
    const [selectedTone, setSelectedTone] = useState('mentor')
    const [sliders] = useState({ strictness: 75, analytical: 90, collaborative: 60 })

    return (
        <div className="text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-hidden">
            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b divider flex items-center justify-between px-8 bg-white/80 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h2 className="text-heading text-lg font-bold tracking-tight">Agent Configuration</h2>
                        <p className="text-subtle text-xs uppercase tracking-widest">Persona Editor · Neural Core v2.4</p>
                    </div>
                    <div className="flex items-center gap-4">

                        <button className="px-4 py-2 text-muted hover:text-heading text-sm font-medium">Discard</button>
                        <button className="bg-primary text-black px-6 py-2 rounded font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20">Save Persona</button>
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
                                                <span className="material-symbols-outlined text-4xl text-primary animate-pulse">grain</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-4 z-10">
                                    <h3 className="text-heading text-xl font-bold">Atlas-7</h3>
                                    <p className="text-primary/60 text-xs tracking-widest uppercase mb-6">Senior Technical Evaluator</p>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full transition-all">
                                        <span className="material-symbols-outlined text-sm text-primary">play_circle</span>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-body">Live Preview Voice</span>
                                    </button>
                                </div>
                                <div className="absolute -top-24 -right-24 size-48 bg-primary/5 rounded-full blur-3xl" />
                                <div className="absolute -bottom-24 -left-24 size-48 bg-primary/5 rounded-full blur-3xl" />
                            </div>

                            {/* Sliders */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="glass-panel rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-heading font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
                                            <span className="material-symbols-outlined text-primary text-lg">tune</span>Personality Spectrum
                                        </h3>
                                        <span className="text-[10px] text-subtle uppercase tracking-widest">Adjust to modify response logic</span>
                                    </div>
                                    <div className="space-y-8">
                                        {[
                                            { left: 'Empathy', right: `Strictness (${sliders.strictness}%)`, value: sliders.strictness, key: 'strictness' as const, leftLabel: 'SUPPORTIVE', rightLabel: 'CHALLENGING' },
                                            { left: `Analytical Depth (${sliders.analytical}%)`, right: 'Soft Skills Focus', value: sliders.analytical, key: 'analytical' as const, leftLabel: 'DATA DRIVEN', rightLabel: 'CULTURE ORIENTED' },
                                            { left: 'Directness', right: `Collaborative (${sliders.collaborative}%)`, value: sliders.collaborative, key: 'collaborative' as const, leftLabel: 'CONCISE', rightLabel: 'ELABORATIVE' },
                                        ].map((slider) => (
                                            <div key={slider.key} className="space-y-3">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                                    <span className={slider.key === 'analytical' ? 'text-primary' : 'text-muted'}>{slider.left}</span>
                                                    <span className={slider.key === 'analytical' ? 'text-muted' : 'text-primary'}>{slider.right}</span>
                                                </div>
                                                <div className="relative h-1 w-full bg-slate-100 dark:bg-charcoal rounded-full overflow-hidden">
                                                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" style={{ width: `${slider.value}%` }} />
                                                </div>
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
                                    <span className="material-symbols-outlined text-primary">record_voice_over</span>
                                    <h3 className="text-heading font-bold uppercase tracking-widest text-sm">Tone of Voice</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {TONES.map((tone) => (
                                        <button
                                            key={tone.id}
                                            onClick={() => setSelectedTone(tone.id)}
                                            className={`p-4 rounded-lg text-center transition-all group ${selectedTone === tone.id ? 'bg-primary/10 border border-primary/40' : 'surface-elevated hover:border-primary/20'}`}
                                        >
                                            <span className={`material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform ${selectedTone === tone.id ? 'text-primary' : 'text-muted'}`}>{tone.icon}</span>
                                            <p className="text-heading text-xs font-bold uppercase mb-1">{tone.label}</p>
                                            <p className="text-subtle text-[10px]">{tone.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-panel rounded-xl p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">database</span>
                                        <h3 className="text-heading font-bold uppercase tracking-widest text-sm">Knowledge Base</h3>
                                    </div>
                                    <button className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">Add Source</button>
                                </div>
                                <div className="flex-1 space-y-3">
                                    {[
                                        { name: 'Distributed_Systems_v4.pdf', category: 'Technical Core', size: '2.4MB' },
                                        { name: 'Senior_Engineering_Rubric.docx', category: 'Assessment Logic', size: '1.1MB' },
                                    ].map((file) => (
                                        <div key={file.name} className="flex items-center justify-between surface-elevated p-3 rounded">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-muted">description</span>
                                                <div>
                                                    <p className="text-heading text-xs font-medium">{file.name}</p>
                                                    <p className="text-[10px] text-subtle uppercase">{file.category} · {file.size}</p>
                                                </div>
                                            </div>
                                            <button className="text-subtle hover:text-red-400">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded mt-2 group cursor-pointer hover:border-primary/20 transition-colors py-8">
                                        <div className="text-center">
                                            <span className="material-symbols-outlined text-subtle mb-1 group-hover:text-primary transition-colors">upload_file</span>
                                            <p className="text-subtle text-[10px] uppercase font-bold tracking-widest">Drop new context files here</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Domain Chips */}
                        <section className="glass-panel rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">terminal</span>
                                <h3 className="text-heading font-bold uppercase tracking-widest text-sm">Domain Expertise</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {DOMAINS.map((d) => (
                                    <span key={d.label} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-2 cursor-pointer transition-all ${d.active ? 'bg-primary/20 border border-primary/40 text-primary' : 'surface-elevated text-body hover:border-primary/40'}`}>
                                        {d.label} {d.active && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                                    </span>
                                ))}
                                <button className="px-4 py-2 surface-elevated text-subtle text-xs font-bold uppercase tracking-wider rounded-full hover:border-primary/20 transition-colors">
                                    + Add Expertise
                                </button>
                            </div>
                        </section>

                        {/* Voice */}
                        <section className="bg-primary/5 border border-primary/20 rounded-xl p-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="size-14 surface-elevated rounded flex items-center justify-center border border-primary/30">
                                    <span className="material-symbols-outlined text-primary text-3xl">graphic_eq</span>
                                </div>
                                <div>
                                    <h4 className="text-heading font-bold text-sm tracking-widest uppercase">Vocal Engine</h4>
                                    <p className="text-muted text-xs">Aries Deep-Learning Waveform (Neutral Masculine)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {[6, 10, 8, 12, 6].map((h, i) => (
                                        <div key={i} className="w-1 bg-primary rounded-full animate-bounce" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s`, opacity: 0.4 + (h / 12) * 0.6 }} />
                                    ))}
                                </div>
                                <button className="px-6 py-2 rounded-full border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all">
                                    Change Voice
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
