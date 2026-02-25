import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'


export default function AuthPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setAuth(
            { id: '1', email, name: 'Alex Rivers', role: 'candidate' },
            { accessToken: 'mock-token', expiresAt: Date.now() + 3600000 }
        )
        navigate('/hardware')
    }

    const handleGoogleLogin = () => {
        setAuth(
            { id: '1', email: 'alex@owlyn.com', name: 'Alex Rivers', role: 'candidate' },
            { accessToken: 'mock-google-token', expiresAt: Date.now() + 3600000 }
        )
        navigate('/hardware')
    }

    return (
        <div className="bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 gold-gradient-bg" />
            </div>



            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-[480px]">
                    <div className="obsidian-card p-8 md:p-12 rounded-lg shadow-2xl">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-3xl">menu_book</span>
                            </div>
                            <h1 className="text-3xl font-bold text-heading tracking-tight mb-3">Welcome to Owlyn</h1>
                            <p className="text-muted text-sm font-light leading-relaxed uppercase tracking-widest">
                                Experience the future of AI-driven career excellence.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 h-14 bg-slate-100 dark:bg-white text-slate-900 rounded font-bold transition-all hover:bg-slate-200 active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                        </div>

                        <div className="relative flex items-center mb-8">
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                            <span className="flex-shrink mx-4 text-xs text-subtle uppercase tracking-widest font-medium">Or email access</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="email">
                                    Institutional Email
                                </label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all"
                                    id="email"
                                    type="email"
                                    placeholder="name@organization.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest" htmlFor="password">
                                        Access Key
                                    </label>
                                    <a className="text-xs text-subtle hover:text-primary transition-colors" href="#">Forgot key?</a>
                                </div>
                                <input
                                    className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all"
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full h-14 bg-primary text-black font-bold rounded uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(197,159,89,0.2)]"
                            >
                                Sign In
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-sm text-muted">
                                New to the elite circle?
                                <a className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="#">Request Membership</a>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-6 text-[10px] text-subtle uppercase tracking-[0.2em] font-medium">
                        <a className="hover:text-primary transition-colors" href="#">Privacy Charter</a>
                        <a className="hover:text-primary transition-colors" href="#">Terms of Protocol</a>
                        <a className="hover:text-primary transition-colors" href="#">Concierge</a>
                    </div>
                </div>
            </main>
        </div>
    )
}
