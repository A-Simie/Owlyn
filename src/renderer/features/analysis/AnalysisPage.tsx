


const MOCK_TRANSCRIPT = [
    { id: '1', time: '00:12:45', speaker: 'ai' as const, text: '"Can you describe a time when you had to resolve a production-level race condition in a distributed environment?"' },
    { id: '2', time: '00:13:12', speaker: 'candidate' as const, text: '"We were seeing intermittent failures in our transaction processing layer. After profiling the actor model implementation, I identified that the lock acquisition was biased. I refactored the scheduling logic to use a fair-wait queue, which reduced latent collisions by 40%..."', isKey: true, aiNote: 'Candidate demonstrates specific technical depth and metrics-driven results.' },
    { id: '3', time: '00:15:20', speaker: 'candidate' as const, text: '"One of the biggest lessons I learned from that was the importance of observability before attempting a fix. If we hadn\'t tagged the trace IDs properly, we would have been hunting shadows."' },
]

export default function AnalysisPage() {
    return (
        <div className="text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-hidden">


            <main className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
                <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 surface-card p-6 rounded">
                    <div className="flex gap-6 items-center">
                        <div className="relative">
                            <div className="size-20 rounded border-2 border-primary p-1">
                                <div className="w-full h-full surface-elevated rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-3xl">person</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#0d0d0d] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-heading tracking-tight">Alex Rivers</h2>
                            <p className="text-primary font-medium tracking-wide flex items-center gap-2">
                                Senior Backend Engineer <span className="size-1 bg-primary/40 rounded-full" /> Interview Date: Oct 24, 2023
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 surface-elevated text-body text-sm font-bold uppercase tracking-widest hover:bg-primary/10 transition-all rounded-sm">
                            <span className="material-symbols-outlined text-sm">download</span>Full Report
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 surface-elevated text-body text-sm font-bold uppercase tracking-widest hover:bg-primary/10 transition-all rounded-sm">
                            <span className="material-symbols-outlined text-sm">share</span>Share
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2 bg-primary text-black text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all rounded-sm">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>Schedule
                        </button>
                    </div>
                </section>

                <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                        <div className="surface-card p-8 rounded flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-8xl text-primary">verified</span>
                            </div>
                            <p className="text-primary uppercase tracking-[0.2em] text-xs font-bold mb-2">Overall Interview Score</p>
                            <div className="relative">
                                <span className="text-7xl font-bold text-heading tracking-tighter">88</span>
                                <span className="text-2xl text-primary/60 font-medium">/100</span>
                            </div>
                            <div className="mt-6 w-full h-1 bg-slate-100 dark:bg-charcoal rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '88%' }} />
                            </div>
                            <p className="mt-4 text-xs text-subtle italic text-center leading-relaxed">Top 4% of candidates for this role</p>
                        </div>

                        <div className="surface-card p-6 rounded flex-1">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Competency Radar</h3>
                            <div className="aspect-square w-full relative flex items-center justify-center">
                                <svg className="w-full h-full transform rotate-45" viewBox="0 0 200 200">
                                    <circle className="text-primary/20" cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <circle className="text-primary/20" cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <circle className="text-primary/20" cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <circle className="text-primary/20" cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                                    <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(197,159,89,0.2)" strokeWidth="1" />
                                    <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(197,159,89,0.2)" strokeWidth="1" />
                                    <polygon points="100,26 172,100 100,164 44,100" fill="rgba(197,159,89,0.3)" stroke="#c59f59" strokeWidth="2" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col justify-between items-center py-2 pointer-events-none">
                                    <span className="text-[10px] font-bold text-heading uppercase surface-elevated px-2 py-0.5">Technical</span>
                                    <span className="text-[10px] font-bold text-heading uppercase surface-elevated px-2 py-0.5">Cultural</span>
                                </div>
                                <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                                    <span className="text-[10px] font-bold text-heading uppercase surface-elevated px-2 py-0.5">Comm.</span>
                                    <span className="text-[10px] font-bold text-heading uppercase surface-elevated px-2 py-0.5">Problem Solving</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div><p className="text-[10px] text-subtle uppercase tracking-widest font-bold">Technical</p><p className="text-xl font-bold text-heading">92%</p></div>
                                <div><p className="text-[10px] text-subtle uppercase tracking-widest font-bold">Problem Solving</p><p className="text-xl font-bold text-heading">90%</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 min-h-0 overflow-hidden">
                        <div className="surface-card px-6 py-4 rounded flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-8">
                                {[
                                    { color: 'bg-green-500', label: 'Eye Tracking Stable' },
                                    { color: 'bg-green-500', label: 'Focus: 98%' },
                                    { color: 'bg-yellow-500', label: 'Ambient Noise: Low' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={`size-2 ${item.color} rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]`} />
                                        <span className="text-xs font-bold uppercase tracking-widest text-body">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-sm">
                                <span className="material-symbols-outlined text-primary text-sm">security</span>
                                <span className="text-[10px] font-bold text-primary uppercase">Integrity Verified</span>
                            </div>
                        </div>

                        <div className="surface-card p-6 rounded">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">AI Agent Analysis</h3>
                                <span className="text-[10px] text-subtle surface-elevated px-2 py-0.5 rounded uppercase">Agent ID: LUM-88-2</span>
                            </div>
                            <p className="text-body text-sm leading-relaxed mb-6">
                                Alex demonstrates an exceptional depth of knowledge in distributed systems and microservices architecture. His explanation of CAP theorem trade-offs was precise and reflected real-world implementation challenges. While technical proficiency is a clear outlier, he tended to dominate the conversation, occasionally missing subtle cues to let the interviewer interject.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs">trending_up</span>Key Strengths
                                    </p>
                                    <ul className="text-xs text-muted space-y-2 list-disc pl-4">
                                        <li>Deep mastery of Rust and concurrency patterns</li>
                                        <li>High adaptability under stress (coding challenge)</li>
                                        <li>Structured approach to ambiguous problems</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs">edit_note</span>Growth Areas
                                    </p>
                                    <ul className="text-xs text-muted space-y-2 list-disc pl-4">
                                        <li>Active listening during group sync scenarios</li>
                                        <li>Briefness in non-technical explanations</li>
                                        <li>Cultural alignment with flat hierarchies</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="surface-card rounded flex-1 flex flex-col min-h-0">
                            <div className="p-4 border-b divider flex items-center justify-between">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Interview Transcript Preview</h3>
                                <span className="text-[10px] font-bold text-muted flex items-center gap-1 uppercase">
                                    <span className="material-symbols-outlined text-xs text-primary">bookmark</span>Key Moments Only
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/50 dark:bg-charcoal/30">
                                {MOCK_TRANSCRIPT.map((entry) => (
                                    <div key={entry.id} className="flex gap-4 relative group">
                                        {entry.isKey && <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform" />}
                                        <div className="w-12 text-[10px] font-bold text-primary/40 pt-1 shrink-0 uppercase tracking-tighter">{entry.time}</div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${entry.speaker === 'ai' ? 'text-primary' : 'text-heading'}`}>
                                                    {entry.speaker === 'ai' ? 'AI Agent' : 'Alex Rivers'}
                                                </p>
                                                {entry.isKey && (
                                                    <span className="text-[10px] font-bold text-black bg-primary px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">auto_awesome</span>Key Insight
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm leading-relaxed ${entry.speaker === 'ai' ? 'text-muted italic border-l-2 border-primary/20 pl-4 bg-slate-100/50 dark:bg-[#0d0d0d]/40 py-2 pr-4' : 'text-heading'}`}>
                                                {entry.text}
                                            </p>
                                            {entry.aiNote && (
                                                <div className="bg-primary/5 border-l border-primary/30 p-2 mt-2">
                                                    <p className="text-[10px] font-bold text-primary uppercase">AI Note:</p>
                                                    <p className="text-[11px] text-muted italic">{entry.aiNote}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-center py-4">
                                    <button className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] border border-primary/20 px-4 py-2 hover:bg-primary hover:text-black transition-all">
                                        View Full Transcript
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    )
}
