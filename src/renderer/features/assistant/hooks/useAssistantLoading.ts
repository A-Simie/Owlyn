import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";
import { extractApiError } from "@/lib/api-error";

export function useAssistantLoading() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initializing Assistant...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await candidateApi.startAssistantSession();
        useCandidateStore.getState().setSession({
          token: res.token,
          livekitToken: res.livekitToken,
          interviewId: res.interviewId,
          accessCode: "TUTOR",
          title: res.title,
          durationMinutes: res.durationMinutes,
          candidateName: res.candidateName,
          personaName: res.personaName,
          toolsEnabled: res.toolsEnabled ?? res.config?.toolsEnabled,
        });
        useCandidateStore.getState().setAssistantMode(true);
        
        setTimeout(async () => {
           if (window.owlyn?.window?.setWidgetMode) {
             await window.owlyn.window.setWidgetMode(true);
           }
           navigate("/assistant");
        }, 1500);

      } catch (err) {
        setError(extractApiError(err).message);
      }
    };

    startSession();
  }, [navigate]);

  return { status, error };
}
