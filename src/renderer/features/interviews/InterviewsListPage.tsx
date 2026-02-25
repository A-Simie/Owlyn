import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface Interview {
    id: string
    candidate: string
    role: string
    date: string
    time: string
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
    score?: number
    duration?: string
}

const MOCK_INTERVIEWS: Interview[] = [
    { id: 'INT-2024-0812', candidate: 'Alexander Pierce', role: 'Senior Product Architect', date: '2024-12-20', time: '10:00 AM', status: 'scheduled' },
    { id: 'INT-2024-0811', candidate: 'Sarah Chen', role: 'ML Engineer', date: '2024-12-19', time: '2:30 PM', status: 'scheduled' },
    { id: 'INT-2024-0810', candidate: 'David Okafor', role: 'Backend Lead', date: '2024-12-18', time: '11:00 AM', status: 'completed', score: 87, duration: '42:15' },
    { id: 'INT-2024-0809', candidate: 'Marie Laurent', role: 'Frontend Architect', date: '2024-12-17', time: '3:00 PM', status: 'completed', score: 92, duration: '38:50' },
    { id: 'INT-2024-0808', candidate: 'James Wright', role: 'DevOps Engineer', date: '2024-12-16', time: '9:00 AM', status: 'completed', score: 74, duration: '35:20' },
    { id: 'INT-2024-0807', candidate: 'Aisha Rahman', role: 'Data Scientist', date: '2024-12-15', time: '4:00 PM', status: 'cancelled' },
    { id: 'INT-2024-0806', candidate: 'Michael Torres', role: 'Systems Architect', date: '2024-12-14', time: '1:00 PM', status: 'completed', score: 95, duration: '45:10' },
]

const STATUS_CONFIG = {
    'scheduled': { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'schedule' },
    'in-progress': { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: 'play_circle' },
    'completed': { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: 'check_circle' },
    'cancelled': { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', icon: 'cancel' },
}

type TabFilter = 'all' | 'scheduled' | 'completed' | 'cancelled'

export default function InterviewsListPage() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabFilter>('all')

    const filtered = activeTab === 'all'
        ? MOCK_INTERVIEWS
        : MOCK_INTERVIEWS.filter(i => i.status === activeTab)

    const scheduled = MOCK_INTERVIEWS.filter(i => i.status === 'scheduled')
    const completed = MOCK_INTERVIEWS.filter(i => i.status === 'completed')

    const handleStartInterview = useCallback((interview: Interview) => {
        navigate('/hardware')
    }, [navigate])

    const handleViewResults = useCallback((interview: Interview) => {
        navigate(`/analysis/${interview.id}`)
    }, [navigate])

    const tabs: { key: TabFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: MOCK_INTERVIEWS.length },
        { key: 'scheduled', label: 'Upcoming', count: scheduled.length },
        { key: 'completed', label: 'Completed', count: completed.length },
        { key: 'cancelled', label: 'Cancelled', count: MOCK_INTERVIEWS.filter(i => i.status === 'cancelled').length },
    ]

    return (
        <div className="min-h-screen p-8 lg:p-12 max-w-5xl">
            <div className="flex items-start justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Interviews</h1>
                    <p className="text-slate-500 text-sm">Manage your scheduled and past interview sessions.</p>
                </div>
                <button
                    onClick={() => navigate('/hardware')}
                    className="flex items-center gap-2 bg-primary text-black px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    New Interview
                </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-blue-400">schedule</span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Upcoming</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{scheduled.length}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-500/10 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-green-400">check_circle</span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{completed.length}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-primary">trending_up</span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Avg Score</span>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {completed.length > 0
                            ? Math.round(completed.reduce((sum, i) => sum + (i.score || 0), 0) / completed.length)
                            : '—'}
                        <span className="text-lg text-primary/60">%</span>
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-[#0d0d0d] p-1 rounded-lg border border-primary/10 w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.key
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-2 text-[10px] ${activeTab === tab.key ? 'text-primary/60' : 'text-slate-600'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Interview list */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-slate-600">
                        <span className="material-symbols-outlined text-4xl mb-3 block">event_busy</span>
                        <p className="text-sm font-medium">No interviews in this category</p>
                    </div>
                )}
                {filtered.map(interview => {
                    const cfg = STATUS_CONFIG[interview.status]
                    return (
                        <div
                            key={interview.id}
                            className="bg-[#0d0d0d] border border-primary/10 rounded-xl p-5 flex items-center justify-between hover:border-primary/25 transition-colors group"
                        >
                            <div className="flex items-center gap-5">
                                <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-primary font-bold text-sm">
                                        {interview.candidate.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-sm font-bold text-white">{interview.candidate}</h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>{interview.role}</span>
                                        <span className="text-slate-700">|</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">calendar_month</span>
                                            {interview.date}
                                        </span>
                                        <span>{interview.time}</span>
                                        {interview.duration && (
                                            <>
                                                <span className="text-slate-700">|</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">timer</span>
                                                    {interview.duration}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {interview.score !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${interview.score >= 85 ? 'bg-green-500' : interview.score >= 70 ? 'bg-primary' : 'bg-red-400'}`}
                                                style={{ width: `${interview.score}%` }}
                                            />
                                        </div>
                                        <span className={`text-sm font-bold ${interview.score >= 85 ? 'text-green-400' : interview.score >= 70 ? 'text-primary' : 'text-red-400'}`}>
                                            {interview.score}%
                                        </span>
                                    </div>
                                )}
                                {interview.status === 'scheduled' && (
                                    <button
                                        onClick={() => handleStartInterview(interview)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                                        Start
                                    </button>
                                )}
                                {interview.status === 'completed' && (
                                    <button
                                        onClick={() => handleViewResults(interview)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">analytics</span>
                                        Results
                                    </button>
                                )}
                                <span className="text-[10px] font-mono text-slate-600">{interview.id}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
