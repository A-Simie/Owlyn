import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth.store";
import { authApi, candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";
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
  const location = useLocation();
  const { setAuth } = useAuthStore();

  // State
  const [step, setStep] = useState<LoginStep>("selection");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get("step") as LoginStep;
    const roleParam = params.get("role") as Role;

    if (stepParam) setStep(stepParam);
    if (roleParam) setSelectedRole(roleParam);
  }, [location.search]);

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
      useCandidateStore.getState().setSession({
        token: res.token,
        livekitToken: res.livekitToken,
        interviewId: res.interviewId,
        accessCode: code,
        title: res.title,
        candidateName: res.candidateName,
        personaName: res.personaName
      });
      setValidationSuccess(true);
      setTimeout(() => navigate("/calibration"), 1000);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateApi.startPracticeSession({
        topic: "General Software Engineering",
        difficulty: "MEDIUM",
        durationMinutes: 45
      });
      useCandidateStore.getState().setSession({
        token: res.token,
        livekitToken: res.livekitToken,
        interviewId: res.interviewId,
        accessCode: "PRACTICE",
        title: "Mock Interview",
        candidateName: "Guest Candidate"
      });
      useCandidateStore.getState().setPracticeMode(true);
      navigate("/calibration");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTutorMode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateApi.startTutorSession();
      useCandidateStore.getState().setSession({
        token: res.token,
        livekitToken: res.livekitToken,
        interviewId: res.interviewId,
        accessCode: "TUTOR",
        title: "AI Tutor Session",
        candidateName: "Guest Candidate"
      });
      useCandidateStore.getState().setPracticeMode(true, true);
      navigate("/calibration");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.05),transparent_70%)] pointer-events-none" />

      <main
        className={`w-full ${step === "selection" || step === "candidate-options" ? "max-w-3xl" : "max-w-md"} z-10 transition-all duration-500`}
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
              <div className="flex flex-col items-center gap-4 text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex"
                >
                  <span
                    className="material-symbols-outlined text-[#c59f59] text-6xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    owl
                  </span>
                </motion.div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
                  Owlyn
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <RoleCard
                  title="Sign in as Candidate"
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
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                  Candidate Entry
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div
                  onClick={() => setStep("interview-code")}
                  className="group relative p-8 surface-card border border-white/5 rounded-[32px] hover:border-primary/40 transition-all cursor-pointer text-center space-y-4"
                >
                  <div className="w-14 h-14 mx-auto flex items-center justify-center text-primary border border-primary/20 rounded-sm bg-primary/5 group-hover:bg-primary group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-2xl">
                      pin
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">
                      Enter Code
                    </h3>
                    <p className="text-slate-500 text-[10px] font-light leading-relaxed">
                      Join a scheduled session.
                    </p>
                  </div>
                </div>

                <div
                  onClick={handlePracticeMode}
                  className="group relative p-8 surface-card border border-white/5 rounded-[32px] hover:border-green-500/40 transition-all cursor-pointer text-center space-y-4"
                >
                  <div className="w-14 h-14 mx-auto flex items-center justify-center text-green-500 border border-green-500/20 rounded-sm bg-green-500/5 group-hover:bg-green-500 group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-2xl">
                      science
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">
                      Practice
                    </h3>
                    <p className="text-slate-500 text-[10px] font-light leading-relaxed">
                      Test skills in mock session.
                    </p>
                  </div>
                </div>

                <div
                  onClick={handleTutorMode}
                  className="group relative p-8 surface-card border border-white/5 rounded-[32px] hover:border-blue-500/40 transition-all cursor-pointer text-center space-y-4"
                >
                  <div className="w-14 h-14 mx-auto flex items-center justify-center text-blue-500 border border-blue-500/20 rounded-sm bg-blue-500/5 group-hover:bg-blue-500 group-hover:text-black transition-all">
                    <span className="material-symbols-outlined text-2xl">
                      school
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white uppercase tracking-wide">
                      AI Tutor
                    </h3>
                    <p className="text-slate-500 text-[10px] font-light leading-relaxed">
                      AI assistance while you code.
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
              className="obsidian-card p-10 rounded-lg shadow-2xl space-y-12"
            >
              <div className="flex flex-col items-center space-y-8">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Change mode
                </button>

                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c59f59]/10 mb-2 border border-[#c59f59]/20">
                  <span
                    className="material-symbols-outlined text-[#c59f59] text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    owl
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                  {validationSuccess ? "Code Verified" : "Access Code"}
                </h2>
              </div>

              <div className="space-y-6">
                {validationSuccess ? (
                  <div className="flex flex-col items-center py-8 space-y-4">
                    <div className="size-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500 animate-pulse">
                        check_circle
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 animate-pulse">
                      Redirecting to lobby...
                    </p>
                  </div>
                ) : (
                  <>
                    <CodeInput
                      onComplete={handleValidateCode}
                      disabled={loading}
                      error={!!error}
                    />

                    {loading && (
                      <div className="flex justify-center mt-4">
                        <div className="size-5 border-2 border-[#c59f59]/30 border-t-[#c59f59] rounded-full animate-spin" />
                      </div>
                    )}

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
                  </>
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
              className="obsidian-card p-10 rounded-lg shadow-2xl space-y-8"
            >
              <div className="flex flex-col items-center space-y-6 text-center">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Change role
                </button>

                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c59f59]/10 mb-2 border border-[#c59f59]/20">
                  <span
                    className="material-symbols-outlined text-[#c59f59] text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    owl
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                    Welcome back
                  </h2>
                  <p className="text-slate-500 text-sm font-light">
                    Enter your credentials to continue to your workspace.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInitiateLogin} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#c59f59] uppercase tracking-widest mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className="w-full bg-[#161616] border border-white/5 rounded-sm py-4 px-4 text-white text-sm focus:border-[#c59f59]/50 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#c59f59] uppercase tracking-widest mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#161616] border border-white/5 rounded-sm py-4 px-4 pr-12 text-white text-sm focus:border-[#c59f59]/50 outline-none transition-all placeholder:text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#c59f59] transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
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
              className="obsidian-card p-10 rounded-lg shadow-2xl space-y-10"
            >
              <div className="flex flex-col items-center space-y-8 text-center">
                <button
                  onClick={handleBack}
                  className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    arrow_back
                  </span>
                  Use different email
                </button>

                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c59f59]/10 mb-2 border border-[#c59f59]/20">
                  <span
                    className="material-symbols-outlined text-[#c59f59] text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    owl
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                    Security Check
                  </h2>
                  <p className="text-slate-500 text-sm font-light leading-relaxed">
                    Verification code sent to
                    <br />
                    <span className="text-white font-medium">{email}</span>
                  </p>
                </div>
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
      className="group relative flex flex-col p-6 bg-[#161616]/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-[#c59f59]/40 hover:bg-[#1A1A1A]/60 transition-all text-left overflow-hidden w-full h-[220px] justify-between"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#c59f59]/5 blur-[40px] rounded-full group-hover:bg-[#c59f59]/10 transition-all duration-700 -translate-y-8 translate-x-8" />

      <div>
        <div className="w-10 h-10 mb-5 flex items-center justify-center text-[#c59f59] border border-[#c59f59]/20 rounded-sm bg-[#c59f59]/5 group-hover:bg-[#c59f59] group-hover:text-black transition-all">
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <h3 className="text-base font-black text-white mb-1.5 tracking-tight group-hover:text-[#c59f59] transition-colors uppercase leading-tight">
          {title}
        </h3>
        <p className="text-slate-500 text-[10px] leading-relaxed max-w-[180px] font-light">
          {description}
        </p>
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

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(data)) return;

    const digits = data.slice(0, 6).split("");
    const newValues = [...values];
    digits.forEach((digit, i) => {
      newValues[i] = digit;
    });
    setValues(newValues);

    const nextIndex = Math.min(digits.length, 5);
    inputs.current[nextIndex]?.focus();

    if (digits.length === 6) {
      onComplete(digits.join(""));
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
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={`w-14 h-20 bg-[#161616] border ${error ? "border-red-500/50" : "border-white/5"} rounded-sm text-center text-3xl font-bold text-[#c59f59] focus:border-[#c59f59]/50 outline-none transition-all`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
