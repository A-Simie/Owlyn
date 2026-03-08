import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";
import { authApi, candidateApi } from "@/api";
import { extractApiError } from "@/lib/api-error";
import OtpInput from "./OtpInput";

type LoginStep =
  | "selection"
  | "candidate-options"
  | "interview-code"
  | "credentials"
  | "otp";
type Role = "ADMIN" | "RECRUITER" | "CANDIDATE";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // State
  const [step, setStep] = useState<LoginStep>("selection");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === "CANDIDATE") {
      setStep("candidate-options");
    } else {
      setStep("credentials");
    }
  };

  const handleBack = () => {
    if (step === "otp") setStep("credentials");
    else if (step === "credentials") setStep("selection");
    else if (step === "candidate-options") setStep("selection");
    else if (step === "interview-code") setStep("candidate-options");
    setError(null);
  };

  const handleInitiateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.initiateLogin({ email, password });
      setStep("otp");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await authApi.verifyLogin({ email, otp: code });
      setAuth(user, token);
      if (user.role === "CANDIDATE") navigate("/hardware");
      else navigate("/interviews");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateApi.validateCode({ code });
      localStorage.setItem("owlyn_guest_token", res.token);
      localStorage.setItem("owlyn_interview_id", res.interviewId);
      localStorage.setItem("owlyn_access_code", code);
      navigate("/lobby");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeMode = () => {
    localStorage.setItem("owlyn_practice_mode", "true");
    navigate("/hardware");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.05),transparent_70%)] pointer-events-none" />

      <main
        className={`w-full ${step === "selection" || step === "candidate-options" ? "max-w-4xl" : "max-w-md"} z-10 transition-all duration-500`}
      >
        <AnimatePresence mode="wait">
          {step === "selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex mb-4"
                >
                  <span
                    className="material-symbols-outlined text-[#c59f59] text-6xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    owl
                  </span>
                </motion.div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                  Owlyn
                </h1>
                <p className="text-[#c59f59] text-[10px] uppercase tracking-[0.4em] font-bold">
                  Choose your role
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <RoleCard
                  title="Candidate Access"
                  description="Join a scheduled session or practice your skills in a mock environment."
                  icon="person"
                  onClick={() => handleRoleSelect("CANDIDATE")}
                />
                <RoleCard
                  title="Workspace Team"
                  description="Access the recruiter dash, manage team members and organization settings."
                  icon="business_center"
                  onClick={() => handleRoleSelect("RECRUITER")}
                />
              </div>
            </motion.div>
          )}

          {step === "candidate-options" && (
            <motion.div
              key="candidate-options"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-[#c59f59] text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Back to selection
                </button>
                <h2 className="text-4xl font-black text-white tracking-tight uppercase">
                  Candidate Entry
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div
                  onClick={() => setStep("interview-code")}
                  className="group relative p-10 surface-card border border-white/5 rounded-[32px] hover:border-[#c59f59]/40 transition-all cursor-pointer text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto flex items-center justify-center text-[#c59f59] border border-[#c59f59]/20 rounded-sm bg-[#c59f59]/5 group-hover:bg-[#c59f59] group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-3xl">
                      pin
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                      Enter Code
                    </h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                      Join a scheduled technical session.
                    </p>
                  </div>
                </div>

                <div
                  onClick={handlePracticeMode}
                  className="group relative p-10 surface-card border border-white/5 rounded-[32px] hover:border-green-500/40 transition-all cursor-pointer text-center space-y-6"
                >
                  <div className="w-16 h-16 mx-auto flex items-center justify-center text-green-500 border border-green-500/20 rounded-sm bg-green-500/5 group-hover:bg-green-500 group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-3xl">
                      science
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                      Practice
                    </h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                      Test your skills in a mock session.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "interview-code" && (
            <motion.div
              key="interview-code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Change mode
                </button>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                  Access Code
                </h2>
              </div>

              <div className="space-y-6">
                <CodeInput
                  onComplete={handleValidateCode}
                  disabled={loading}
                  error={!!error}
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-xs">
                      error
                    </span>
                    {error}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {step === "credentials" && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Change role
                </button>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">
                  Welcome back
                </h2>
                <p className="text-slate-500 text-sm font-light">
                  Enter your credentials to continue to your workspace.
                </p>
              </div>

              <form onSubmit={handleInitiateLogin} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600 group-focus-within:text-[#c59f59] transition-colors">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-[#161616] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-white text-sm focus:border-[#c59f59]/50 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600 group-focus-within:text-[#c59f59] transition-colors">
                      lock
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-[#161616] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-white text-sm focus:border-[#c59f59]/50 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#c59f59] text-black font-bold uppercase tracking-[0.3em] text-xs rounded-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 h-[56px] aion-glow"
                >
                  {loading ? (
                    <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                  ) : (
                    "Continue"
                  )}
                </button>

                {selectedRole === "RECRUITER" && (
                  <p className="text-center text-xs text-slate-600 mt-8">
                    Don't have a workspace?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="text-[#c59f59] hover:underline font-bold transition-all"
                    >
                      Sign up
                    </button>
                  </p>
                )}
              </form>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Use different email
                </button>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                  Security Check
                </h2>
                <p className="text-slate-500 text-sm font-light leading-relaxed">
                  Verification code sent to
                  <br />
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <div className="space-y-8">
                <OtpInput onComplete={handleVerifyOtp} disabled={loading} />

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="text-center">
                  <button
                    disabled={loading}
                    onClick={handleInitiateLogin}
                    className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-[#c59f59] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    <span className="material-symbols-outlined text-base">
                      refresh
                    </span>
                    Resend Code
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function RoleCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col p-10 bg-[#161616]/40 backdrop-blur-xl border border-white/5 rounded-[32px] hover:border-[#c59f59]/40 hover:bg-[#1A1A1A]/60 transition-all text-left overflow-hidden w-full h-[320px] justify-between"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#c59f59]/5 blur-[60px] rounded-full group-hover:bg-[#c59f59]/10 transition-all duration-700 -translate-y-12 translate-x-12" />

      <div>
        <div className="w-14 h-14 mb-8 flex items-center justify-center text-[#c59f59] border border-[#c59f59]/20 rounded-sm bg-[#c59f59]/5 group-hover:bg-[#c59f59] group-hover:text-black transition-all">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-[#c59f59] transition-colors uppercase leading-tight">
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-[240px] font-light">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3 text-[#c59f59] font-black text-[10px] uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
        Access Portal
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </div>
    </button>
  );
}

function CodeInput({
  onComplete,
  disabled,
  error,
}: {
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const [values, setValues] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== "")) {
      onComplete(newValues.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className={`w-14 h-20 bg-[#161616] border ${error ? "border-red-500/50" : "border-white/5"} rounded-sm text-center text-3xl font-bold text-[#c59f59] focus:border-[#c59f59]/50 outline-none transition-all`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
