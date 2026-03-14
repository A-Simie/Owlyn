import { useState } from "react";

interface SignupCredentialsFormProps {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  fieldErrors: Record<string, string>;
  passwordRules: { label: string; met: boolean }[];
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignupCredentialsForm({
  fullName, setFullName, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword,
  fieldErrors, passwordRules, loading, onSubmit
}: SignupCredentialsFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-name">Full Name</label>
        <input
          className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.fullName ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
          id="signup-name" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} autoFocus
        />
        {fieldErrors.fullName && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.fullName}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-email">Email</label>
        <input
          className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.email ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
          id="signup-email" type="email" placeholder="name@organization.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
        />
        {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.email}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-password">Password</label>
        <div className="relative">
          <input
            className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 pr-12 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.password ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
            id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowPasswordRules(true)} onBlur={() => setShowPasswordRules(false)} disabled={loading}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password}</p>}
        {showPasswordRules && password.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {passwordRules.map((rule) => (
              <div key={rule.label} className="flex items-center gap-2 text-xs">
                <span className={`material-symbols-outlined text-sm ${rule.met ? "text-green-400" : "text-slate-600"}`}>
                  {rule.met ? "check_circle" : "circle"}
                </span>
                <span className={rule.met ? "text-green-400" : "text-slate-500"}>{rule.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-primary uppercase tracking-widest mb-2" htmlFor="signup-confirm">Confirm Password</label>
        <div className="relative">
          <input
            className={`w-full bg-slate-50 dark:bg-background-dark border rounded px-4 py-3.5 pr-12 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 input-gold-focus transition-all ${fieldErrors.confirmPassword ? "border-red-500" : "border-slate-200 dark:border-slate-800"}`}
            id="signup-confirm" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.confirmPassword}</p>}
      </div>

      <button type="submit" disabled={loading} className="w-full h-14 bg-primary text-black font-bold rounded uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(197,159,89,0.2)] disabled:opacity-50 flex items-center justify-center gap-2">
        {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
        {loading ? "Sending OTP..." : "Create Account"}
      </button>
    </form>
  );
}
