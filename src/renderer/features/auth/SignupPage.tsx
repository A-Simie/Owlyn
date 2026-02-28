import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api'
import { SignupPayloadSchema } from '@shared/schemas/auth.schema'
import { extractApiError } from '@/lib/api-error'
import OtpInput from './OtpInput'

type Step = 'credentials' | 'otp'

export default function SignupPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)

    const [step, setStep] = useState<Step>('credentials')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [apiError, setApiError] = useState<string | null>(null)
    const [otpError, setOtpError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showPasswordRules, setShowPasswordRules] = useState(false)

    const passwordRules = [
        { label: 'At least 6 characters', met: password.length >= 6 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(password) },
        { label: 'One number', met: /[0-9]/.test(password) },
        { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
    ]

    async function handleSignupSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFieldErrors({})
        setApiError(null)

        if (password !== confirmPassword) {
            setFieldErrors({ confirmPassword: 'Passwords do not match' })
            return
        }

        const result = SignupPayloadSchema.safeParse({ email, password, fullName })
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
            await authApi.initiateSignup(result.data)
            console.log(authApi.initiateSignup(result.data))
            setStep('otp')
        } catch (error) {
            const err = extractApiError(error)
            console.log(err)
            setApiError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleOtpComplete(otp: string) {
        setOtpError(null)
        setLoading(true)
        try {
            const { user, token } = await authApi.verifySignup({ otp, email })
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
                                <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
                            </div>
                            <h1 className="text-3xl font-bold text-heading tracking-tight mb-3">
                                {step === 'credentials' ? 'Create Account' : 'Verify Your Email'}
                            </h1>
                            <p className="text-muted text-sm font-light leading-relaxed uppercase tracking-widest">
                                {step === 'credentials'
                                    ? 'Join the Owlyn platform'
                                    : `We sent a 6-digit code to ${email}`}
                            </p>
                        </div>

                        {apiError && (
                            <div className="mb-6 px-4 py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {apiError}
                            </div>
                        )}

                        {step === 'credentials' && (
                            <form onSubmit={handleSignupSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-name">
                                        Full Name
                                    </label>
                                    <input
                                        className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        id="signup-name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={loading}
                                        autoFocus
                                    />
                                    {fieldErrors.fullName && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.fullName}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-email">
                                        Email
                                    </label>
                                    <input
                                        className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        id="signup-email"
                                        type="email"
                                        placeholder="name@organization.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                    {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-password">
                                        Password
                                    </label>
                                    <input
                                        className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        id="signup-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setShowPasswordRules(true)}
                                        onBlur={() => setShowPasswordRules(false)}
                                        disabled={loading}
                                    />
                                    {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password}</p>}

                                    {showPasswordRules && password.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {passwordRules.map((rule) => (
                                                <div key={rule.label} className="flex items-center gap-2 text-xs">
                                                    <span className={`material-symbols-outlined text-sm ${rule.met ? 'text-green-400' : 'text-slate-600'}`}>
                                                        {rule.met ? 'check_circle' : 'circle'}
                                                    </span>
                                                    <span className={rule.met ? 'text-green-400' : 'text-slate-500'}>{rule.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-confirm">
                                        Confirm Password
                                    </label>
                                    <input
                                        className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        id="signup-confirm"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.confirmPassword}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-primary text-black font-bold rounded uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(197,159,89,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                    {loading ? 'Sending OTP...' : 'Create Account'}
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
                                        Creating your account...
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setStep('credentials'); setOtpError(null) }}
                                    className="w-full text-sm text-subtle hover:text-primary transition-colors"
                                >
                                    ← Back to signup
                                </button>
                            </div>
                        )}

                        <div className="mt-10 text-center">
                            <p className="text-sm text-muted">
                                Already have an account?
                                <Link to="/auth" className="text-primary font-bold hover:underline underline-offset-4 ml-1">Sign In</Link>
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
