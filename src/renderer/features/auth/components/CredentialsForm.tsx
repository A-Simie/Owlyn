import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface CredentialsFormProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  error: string | null;
  role: "ADMIN" | "RECRUITER" | "CANDIDATE" | null;
}

export function CredentialsForm({ onBack, onSubmit, email, setEmail, password, setPassword, loading, error, role }: CredentialsFormProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-[#111] p-10 rounded-lg shadow-2xl space-y-8 border border-white/5">
      <div className="flex flex-col items-center space-y-6 text-center">
        <button onClick={onBack} className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Change role
        </button>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c59f59]/10 mb-2 border border-[#c59f59]/20">
          <span className="material-symbols-outlined text-[#c59f59] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Welcome back</h2>
          <p className="text-slate-500 text-sm font-light">Enter your credentials to continue to your workspace.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#c59f59] uppercase tracking-widest mb-2">Email address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.com" className="w-full bg-[#161616] border border-white/5 rounded-sm py-4 px-4 text-white text-sm focus:border-[#c59f59]/50 outline-none transition-all placeholder:text-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#c59f59] uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#161616] border border-white/5 rounded-sm py-4 px-4 pr-12 text-white text-sm focus:border-[#c59f59]/50 outline-none transition-all placeholder:text-slate-700" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#c59f59]">
                <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full h-[56px] bg-[#c59f59] text-black font-bold uppercase tracking-[0.3em] text-xs rounded-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
          {loading ? <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" /> : "Continue"}
        </button>

        {role === "RECRUITER" && (
          <p className="text-center text-xs text-slate-600 mt-8">
            Don't have a workspace? <button type="button" onClick={() => navigate("/signup")} className="text-[#c59f59] hover:underline font-bold">Sign up</button>
          </p>
        )}
      </form>
    </motion.div>
  );
}
