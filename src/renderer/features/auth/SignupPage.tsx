import { useNavigate, Link } from "react-router-dom";
import { useSignup } from "./hooks/useSignup";
import { SignupCredentialsForm } from "./components/SignupCredentialsForm";
import { SignupOtpVerification } from "./components/SignupOtpVerification";

export default function SignupPage() {
  const navigate = useNavigate();
  const {
    step, setStep,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    fieldErrors, apiError, otpError, loading,
    passwordRules,
    initiateSignup,
    verifyOtp,
  } = useSignup();

  return (
    <div className="bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 gold-gradient-bg" />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-subtle hover:text-primary transition-colors mb-6 text-sm font-medium group">
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Back to Home
          </button>

          <div className="obsidian-card p-8 md:p-12 rounded-lg shadow-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
              </div>
              <h1 className="text-3xl font-bold text-heading tracking-tight mb-3">
                {step === "credentials" ? "Create Account" : "Verify Your Email"}
              </h1>
              <p className="text-muted text-sm font-light leading-relaxed uppercase tracking-widest">
                {step === "credentials" ? "Join the Owlyn platform" : `We sent a 6-digit code to ${email}`}
              </p>
            </div>

            {apiError && (
              <div className="mb-6 px-4 py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {apiError}
              </div>
            )}

            {step === "credentials" ? (
              <SignupCredentialsForm 
                fullName={fullName} setFullName={setFullName}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                fieldErrors={fieldErrors} passwordRules={passwordRules}
                loading={loading} onSubmit={initiateSignup}
              />
            ) : (
              <SignupOtpVerification 
                onBack={() => setStep("credentials")} 
                onVerify={verifyOtp} 
                loading={loading} 
                error={otpError} 
              />
            )}

            <div className="mt-10 text-center">
              <p className="text-sm text-muted">
                Already have an account?
                <Link to="/auth?step=credentials&role=RECRUITER" className="text-primary font-bold hover:underline underline-offset-4 ml-1">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
