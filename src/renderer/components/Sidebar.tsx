import { NavLink, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
    { path: '/talent', icon: 'dashboard', label: 'Dashboard' },
    { path: '/interviews', icon: 'videocam', label: 'Interviews' },
    { path: '/agent', icon: 'smart_toy', label: 'AI Personas' },
    { path: '/analysis', icon: 'library_books', label: 'Library' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
    const navigate = useNavigate()

    return (
        <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col bg-[#0d0d0d] border-r border-primary/15 z-50">
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 pt-6 pb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-black text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-sm font-bold tracking-tight text-white">OWLYN</span>
                    <span className="text-[9px] font-semibold tracking-[0.25em] text-primary/60 uppercase">Enterprise</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col gap-0.5 px-3 mt-4">
                {NAV_ITEMS.map(({ path, icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                                )}
                                <span className="material-symbols-outlined text-lg" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                    {icon}
                                </span>
                                {label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* CTA */}
            <div className="p-4">
                <button
                    onClick={() => navigate('/hardware')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    New Interview
                </button>
            </div>
        </aside>
    )
}
