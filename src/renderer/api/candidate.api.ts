import { apiClient } from "@/lib/api-client";
import type {
  ValidateCodePayload,
  ValidateCodeResponse,
} from "@shared/schemas/candidate.schema";

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

  initiateLockdown: async (accessCode: string, guestToken: string) => {
    // 1. Tell Backend to set status to ACTIVE
    const { data } = await apiClient.put<{ message: string }>(
      `/api/interviews/${accessCode}/status/active`,
      null,
      { headers: { Authorization: `Bearer ${guestToken}` } },
    );
    // 2. Tell Electron to enable local restrictions
    if (window.owlyn?.lockdown) {
      await window.owlyn.lockdown.toggle(true);
    }
    return data;
  },

  releaseLockdown: async () => {
    if (window.owlyn?.lockdown) {
      await window.owlyn.lockdown.toggle(false);
    }
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
};
