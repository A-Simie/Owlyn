import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/api";
import { SignupPayloadSchema } from "@shared/schemas/auth.schema";
import { extractApiError } from "@/lib/api-error";

export type SignupStep = "credentials" | "otp";

export function useSignup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<SignupStep>("credentials");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const initiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    const result = SignupPayloadSchema.safeParse({ email, password, fullName });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errs[field]) errs[field] = err.message;
      });
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await authApi.initiateSignup(result.data);
      setStep("otp");
    } catch (error) {
      setApiError(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setOtpError(null);
    setLoading(true);
    try {
      const { user, token } = await authApi.verifySignup({ otp, email });
      setAuth(user, token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setOtpError(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    step, setStep,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    fieldErrors, apiError, otpError, loading,
    passwordRules,
    initiateSignup,
    verifyOtp,
  };
}
