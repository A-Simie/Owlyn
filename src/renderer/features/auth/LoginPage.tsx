import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./hooks/useAuth";

// Components
import { LoginRoleSelection } from "./components/LoginRoleSelection";
import { CandidateOptions } from "./components/CandidateOptions";
import { PracticeSetup } from "./components/PracticeSetup";
import { AccessCodeEntry } from "./components/AccessCodeEntry";
import { CredentialsForm } from "./components/CredentialsForm";
import { OtpVerification } from "./components/OtpVerification";

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    step, setStep,
    selectedRole,
    email, setEmail,
    password, setPassword,
    loading,
    error,
    validationSuccess,
    handleRoleSelect,
    handleBack,
    initiateLogin,
    verifyOtp,
    validateCode
  } = useAuth();

  const handleSelectAction = (action: "code" | "practice" | "tutor") => {
    if (action === "code") setStep("interview-code");
    else if (action === "practice") setStep("practice-config");
    else if (action === "tutor") navigate("/assistant-loading");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.05),transparent_70%)] pointer-events-none" />

      <main className={`w-full ${step === "selection" || step === "candidate-options" ? "max-w-3xl" : "max-w-md"} z-10 transition-all duration-500`}>
        <AnimatePresence mode="wait">
          {step === "selection" && <LoginRoleSelection onSelect={handleRoleSelect} />}
          
          {step === "candidate-options" && (
            <CandidateOptions onBack={handleBack} onSelectAction={handleSelectAction} />
          )}

          {step === "practice-config" && (
            <PracticeSetup onBack={handleBack} />
          )}

          {step === "interview-code" && (
            <AccessCodeEntry 
              onBack={handleBack} 
              onValidate={validateCode} 
              loading={loading} 
              error={error} 
              success={validationSuccess} 
            />
          )}

          {step === "credentials" && (
            <CredentialsForm 
              onBack={handleBack} 
              onSubmit={(e) => { e.preventDefault(); initiateLogin(); }} 
              email={email} 
              setEmail={setEmail} 
              password={password} 
              setPassword={setPassword} 
              loading={loading} 
              error={error} 
              role={selectedRole}
            />
          )}

          {step === "otp" && (
            <OtpVerification 
              onBack={handleBack} 
              onVerify={verifyOtp} 
              onResend={initiateLogin} 
              email={email} 
              loading={loading} 
              error={error} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
