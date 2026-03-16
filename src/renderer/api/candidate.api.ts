import { apiClient } from "@/lib/api-client";
import type {
  ValidateCodePayload,
  ValidateCodeResponse,
} from "@shared/schemas/candidate.schema";

let lockdownTimeout: ReturnType<typeof setTimeout> | null = null;

export const candidateApi = {
  healthCheck: async () => {
    const { data } = await apiClient.get<{ status: string; timestamp: number }>(
      "/api/health",
    );
    return data;
  },

  validateCode: async (payload: ValidateCodePayload) => {
    const { data } = await apiClient.post<ValidateCodeResponse>(
      "/api/interviews/validate-code",
      payload,
    );
    return data;
  },

  activateInterviewStatus: async (accessCode: string, guestToken: string) => {
    const { data } = await apiClient.put<{ message: string }>(
      `/api/interviews/${accessCode}/status/active`,
      null,
      { headers: { Authorization: `Bearer ${guestToken}` } },
    );
    return data;
  },

  initiateLockdown: async (accessCode: string, guestToken: string) => {
    const { data } = await apiClient.put<{ message: string }>(
      `/api/interviews/${accessCode}/status/active`,
      null,
      { headers: { Authorization: `Bearer ${guestToken}` } },
    );
    if (window.owlyn?.lockdown) {
      await window.owlyn.lockdown.toggle(true);
    }
    return data;
  },

  completeInterview: async (accessCode: string, guestToken: string) => {
    const { data } = await apiClient.put<{ message: string }>(
      `/api/interviews/${accessCode}/status/completed`,
      null,
      { headers: { Authorization: `Bearer ${guestToken}` } },
    );
    return data;
  },

  notifySessionEnded: async (
    accessCode: string,
    guestToken: string,
    reason: string,
  ) => {
    const { data } = await apiClient.post<{ message: string; reason: string }>(
      `/api/interviews/${accessCode}/session-ended`,
      { reason },
      { headers: { Authorization: `Bearer ${guestToken}` } },
    );
    return data;
  },

  setNativeLockdown: async (enabled: boolean) => {
    if (lockdownTimeout) {
      clearTimeout(lockdownTimeout);
      lockdownTimeout = null;
    }
    
    if (window.owlyn?.lockdown) {
      await window.owlyn.lockdown.toggle(enabled);
    }
  },

  releaseLockdown: async () => {
    // Debounce the actual release to prevent flickering during React remounts
    if (lockdownTimeout) clearTimeout(lockdownTimeout);
    
    lockdownTimeout = setTimeout(async () => {
      if (window.owlyn?.lockdown) {
        await window.owlyn.lockdown.toggle(false);
      }
      lockdownTimeout = null;
    }, 150); 
  },
  getCopilotSuggestion: async (
    code: string,
    language: string,
    cursorPosition: number,
  ) => {
    const { data } = await apiClient.post<{ suggestion: string }>(
      "/api/copilot",
      { code, language, cursorPosition },
    );
    return data;
  },

  startPracticeSession: async (payload: {
    topic: string;
    difficulty: string;
    durationMinutes: number;
    language: string;
  }) => {
    const { data } = await apiClient.post<ValidateCodeResponse>(
      "/api/public/sessions/practice",
      payload,
    );
    return data;
  },

  startAssistantSession: async () => {
    const { data } = await apiClient.post<ValidateCodeResponse>(
      "/api/public/sessions/tutor",
    );
    return data;
  },
};
