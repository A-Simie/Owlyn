import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useCandidateStore } from "@/stores/candidate.store";
import { authApi, candidateApi } from "@/api";
import { extractApiError } from "@/lib/api-error";

export type LoginStep = "selection" | "candidate-options" | "interview-code" | "practice-config" | "credentials" | "otp";
export type Role = "ADMIN" | "RECRUITER" | "CANDIDATE";

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<LoginStep>("selection");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get("step") as LoginStep;
    const roleParam = params.get("role") as Role;
    if (stepParam) setStep(stepParam);
    if (roleParam) setSelectedRole(roleParam);
  }, [location.search]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep(role === "CANDIDATE" ? "candidate-options" : "credentials");
  };

  const handleBack = () => {
    if (step === "otp") setStep("credentials");
    else if (step === "credentials" || step === "candidate-options") setStep("selection");
    else if (step === "interview-code" || step === "practice-config") setStep("candidate-options");
    setError(null);
  };

  const initiateLogin = async () => {
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

  const verifyOtp = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await authApi.verifyLogin({ email, otp });
      setAuth(user, token);
      navigate(user.role === "CANDIDATE" ? "/hardware" : "/interviews");
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const validateCode = async (code: string) => {
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
        durationMinutes: res.durationMinutes,
        candidateName: res.candidateName,
        personaName: res.personaName,
        toolsEnabled: res.toolsEnabled ?? res.config?.toolsEnabled,
      });
      useCandidateStore.getState().setPracticeMode(false);
      setValidationSuccess(true);
      setTimeout(() => navigate("/calibration"), 1000);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    step, setStep,
    selectedRole, setSelectedRole,
    email, setEmail,
    password, setPassword,
    loading, setLoading,
    error, setError,
    validationSuccess,
    handleRoleSelect,
    handleBack,
    initiateLogin,
    verifyOtp,
    validateCode
  };
}
