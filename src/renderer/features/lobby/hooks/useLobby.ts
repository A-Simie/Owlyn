import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";

export function useLobby() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPracticeMode, accessCode, token } = useCandidateStore();

  useEffect(() => {
    candidateApi.healthCheck().catch((err) => {
      console.error("Health check failed:", err);
    });
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    try {
      if (!isPracticeMode && accessCode && token) {
        await candidateApi.initiateLockdown(accessCode, token);
      }
      navigate("/interview");
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(err?.response?.data?.message || "This interview session is inactive or already completed. Please contact your recruiter.");
      setIsStarting(false);
    }
  };

  return { isStarting, error, handleStart };
}
