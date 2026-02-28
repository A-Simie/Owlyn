import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api'
import { LoginPayloadSchema } from '@shared/schemas/auth.schema'
import { extractApiError, isApiError } from '@/lib/api-error'
import OtpInput from './OtpInput'

type Step = 'credentials' | 'otp'

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)

    const [step, setStep] = useState<Step>('credentials')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [apiError, setApiError] = useState<string | null>(null)
    const [otpError, setOtpError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleCredentialsSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFieldErrors({})
        setApiError(null)

        const result = LoginPayloadSchema.safeParse({ email, password })
        if (!result.success) {
            const errs: Record<string, string> = {}
            result.error.errors.forEach((err) => {
                const field = err.path[0] as string
                if (!errs[field]) errs[field] = err.message
            })
            setFieldErrors(errs)
            return
        }

        setLoading(true)
        try {
            await authApi.initiateLogin(result.data)
            setStep('otp')
        } catch (error) {
            const err = extractApiError(error)
            setApiError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleOtpComplete(otp: string) {
        setOtpError(null)
        setLoading(true)
        try {
            const { user, token } = await authApi.verifyLogin({ otp, email })
            setAuth(user, token)
            navigate('/dashboard', { replace: true })
        } catch (error) {
            const err = extractApiError(error)
            setOtpError(err.message)
        } finally {
            setLoading(false)
        }
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
                            <h1 className="text-3xl font-bold text-heading tracking-tight mb-3">
                                {step === 'credentials' ? 'Welcome Back' : 'Verify Your Identity'}
                            </h1>
                            <p className="text-muted text-sm font-light leading-relaxed uppercase tracking-widest">
                                {step === 'credentials'
                                    ? 'Sign in to your Owlyn account'
                                    : `We sent a 6-digit code to ${email}`}
                            </p>
                        </div>

                        {apiError && (
                            <div className="mb-6 px-4 py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {apiError}
                            </div>
                        )}

                        {step === 'credentials' && (
                            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="login-email">
                                        Email
                                    </label>
                                    <input
                                        className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        id="login-email"
                                        type="email"
                                        placeholder="name@organization.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        autoFocus
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-red-400 text-xs mt-1.5">{fieldErrors.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="login-password">
                                        Password
                                    </label>
                                    <input
                                        className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    {fieldErrors.password && (
                                        <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-primary text-black font-bold rounded uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(197,159,89,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                    {loading ? 'Sending OTP...' : 'Sign In'}
                                </button>
                            </form>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-8">
                                <OtpInput
                                    onComplete={handleOtpComplete}
                                    disabled={loading}
                                    error={otpError}
                                />
                                {loading && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted">
                                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        Verifying...
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setStep('credentials'); setOtpError(null) }}
                                    className="w-full text-sm text-subtle hover:text-primary transition-colors"
                                >
                                    ← Back to login
                                </button>
                            </div>
                        )}

                        <div className="mt-10 text-center">
                            <p className="text-sm text-muted">
                                Don&apos;t have an account?
                                <Link to="/signup" className="text-primary font-bold hover:underline underline-offset-4 ml-1">Create Account</Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-6 text-[10px] text-subtle uppercase tracking-[0.2em] font-medium">
                        <a className="hover:text-primary transition-colors" href="#">Privacy Charter</a>
                        <a className="hover:text-primary transition-colors" href="#">Terms of Protocol</a>
                        <a className="hover:text-primary transition-colors" href="#">Support</a>
                    </div>
                </div>
            </main>
        </div>
    )
}
