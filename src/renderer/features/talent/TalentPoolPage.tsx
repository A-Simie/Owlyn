


const CANDIDATES = [
    { id: '1', name: 'Alexander Thorne', location: 'San Francisco, CA', role: 'Lead AI Engineer', expertise: 'Expert: PyTorch, LLMs', score: 94, status: 'HIGHLY RECOMMENDED', statusColor: 'bg-primary/10 text-primary border-primary/20', date: 'Oct 24, 2023', online: true, borderPrimary: true },
    { id: '2', name: 'Elena Volkov', location: 'London, UK', role: 'SVP of Product', expertise: '', score: 89, status: 'Under Review', statusColor: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20', date: 'Oct 23, 2023', online: false, borderPrimary: false },
    { id: '3', name: 'Marcus Wright', location: 'Toronto, CA', role: 'Senior Data Scientist', expertise: '', score: 91, status: 'HIGHLY RECOMMENDED', statusColor: 'bg-primary/10 text-primary border-primary/20', date: 'Oct 22, 2023', online: false, borderPrimary: true },
]

export default function TalentPoolPage() {
    const circumference = 2 * Math.PI * 18

    return (
        <div className="text-slate-900 dark:text-slate-100 h-full overflow-hidden flex flex-col">


            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 border-r divider surface-alt flex flex-col p-6 overflow-y-auto">
                    <div className="space-y-4 mb-10">
                        {[
                            { label: 'Total Candidates', value: '1,284', change: '+12%' },
                            { label: 'Average Score', value: '88.4%', change: '+2.5%' },
                            { label: 'Interviews Weekly', value: '42', change: 'Active' },
                        ].map((stat) => (
                            <div key={stat.label} className="p-4 rounded-xl surface-card hover:border-primary/30 transition-all">
                                <p className="text-[10px] uppercase tracking-widest text-subtle mb-1">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-2xl font-bold text-heading">{stat.value}</h3>
                                    <span className="text-xs text-green-500 mb-1">{stat.change}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Advanced Filters</h4>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-subtle tracking-tighter">Candidate Role</label>
                            <select className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg text-xs text-body focus:border-primary focus:ring-0 py-2 px-3">
                                <option>All Engineering Roles</option>
                                <option>Lead AI Engineer</option>
                                <option>ML Architect</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-subtle tracking-tighter">Minimum AI Score</label>
                            <input className="w-full h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" type="range" defaultValue="85" />
                            <div className="flex justify-between text-[10px] text-subtle mt-2">
                                <span>0%</span><span className="text-primary font-bold">85%</span><span>100%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-subtle tracking-tighter">Status</label>
                            <div className="flex flex-wrap gap-2">
                                <button className="px-2 py-1 text-[10px] rounded border border-primary bg-primary/20 text-primary">High Rec</button>
                                <button className="px-2 py-1 text-[10px] rounded border border-slate-200 dark:border-primary/10 text-subtle hover:border-primary/40">Review</button>
                                <button className="px-2 py-1 text-[10px] rounded border border-slate-200 dark:border-primary/10 text-subtle hover:border-primary/40">Archive</button>
                            </div>
                        </div>
                        <button className="w-full py-2 bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all rounded-lg mt-4">Update View</button>
                    </div>
                </aside>

                {/* Main Table */}
                <section className="flex-1 flex flex-col surface relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="p-8 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-light text-heading">Talent Pool</h2>
                                <p className="text-sm text-muted mt-1">Found 1,284 elite profiles matching your criteria.</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 surface-elevated text-xs font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg">
                                <span className="material-symbols-outlined text-sm">download</span>Export List
                            </button>
                        </div>

                        <div className="rounded-xl surface-card overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-primary/5">
                                    <tr>
                                        {['Candidate', 'Role', 'AI Score', 'Status', 'Interview Date', ''].map((h) => (
                                            <th key={h} className={`px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70 ${h === 'AI Score' ? 'text-center' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                                    {CANDIDATES.map((c) => {
                                        const dashoffset = circumference - (c.score / 100) * circumference
                                        return (
                                            <tr key={c.id} className="group hover:bg-primary/[0.03] transition-colors cursor-pointer">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className={`w-10 h-10 rounded-full ${c.borderPrimary ? 'border-2 border-primary' : 'border border-slate-200 dark:border-primary/20'} bg-primary/10 flex items-center justify-center`}>
                                                                <span className="material-symbols-outlined text-primary text-sm">person</span>
                                                            </div>
                                                            {c.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-obsidian rounded-full" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-heading">{c.name}</p>
                                                            <p className="text-xs text-subtle">{c.location}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-medium text-body">{c.role}</p>
                                                    {c.expertise && <p className="text-[10px] text-primary/60">{c.expertise}</p>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle className="text-primary/10" cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeWidth="2" />
                                                                <circle className="text-primary" cx="20" cy="20" r="18" fill="transparent" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeWidth="2" />
                                                            </svg>
                                                            <span className="absolute text-[10px] font-bold text-primary">{c.score}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border uppercase ${c.statusColor}`}>{c.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-subtle">{c.date}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="material-symbols-outlined text-slate-400 dark:text-slate-600 hover:text-primary transition-colors">more_vert</button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Right Sidebar */}
                <aside className="w-80 border-l divider surface-alt flex flex-col overflow-hidden">
                    <div className="p-6 border-b divider">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Talent Spotlight</h4>
                        <div className="relative group cursor-pointer overflow-hidden rounded-xl surface-elevated h-32 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary/20 text-6xl">person</span>
                            <div className="absolute inset-0 bg-gradient-to-t from-black dark:from-background-dark to-transparent" />
                            <div className="absolute bottom-3 left-3">
                                <p className="text-xs font-bold text-white">Alexander Thorne</p>
                                <p className="text-[10px] text-primary">Candidate of the Day</p>
                            </div>
                            <div className="absolute top-3 right-3 bg-primary/20 backdrop-blur-md px-2 py-1 rounded-lg border border-primary/40">
                                <span className="text-[10px] font-bold text-primary">98 AI Rank</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Real-time Evaluations</h4>
                        <div className="space-y-6">
                            {[
                                { title: 'Evaluation Completed', desc: 'System processed video feed for Marcus Wright. Core competency: Strategic Logic (8.9/10).', time: '2 minutes ago', active: true },
                                { title: 'Interview Scheduled', desc: 'Elena Volkov added to Round 2 panel for Q4 Product Roadmap review.', time: '14 minutes ago', active: false },
                                { title: 'New Profile Ingested', desc: 'Talent Pipeline auto-imported 12 profiles from LinkedIn Elite API.', time: '1 hour ago', active: false },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i < 2 && <div className="absolute left-[7px] top-6 bottom-[-24px] w-[1px] bg-primary/20" />}
                                    <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${item.active ? 'bg-primary ring-4 ring-primary/10' : 'border border-primary/40 bg-white dark:bg-background-dark'}`} />
                                    <div className="space-y-1">
                                        <p className={`text-xs font-semibold ${item.active ? 'text-heading' : 'text-muted'}`}>{item.title}</p>
                                        <p className="text-[10px] text-subtle leading-relaxed">{item.desc}</p>
                                        <p className="text-[10px] text-primary/40 uppercase tracking-tighter">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5">
                        <button className="w-full flex items-center justify-between group">
                            <span className="text-xs font-bold text-body group-hover:text-primary transition-colors">View All Activity</span>
                            <span className="material-symbols-outlined text-sm text-primary">arrow_forward_ios</span>
                        </button>
                    </div>
                </aside>
            </main>


        </div>
    )
}
