import { apiClient } from "@/lib/api-client";
import { z } from "zod";

export const ReportSchema = z.object({
  reportId: z.string(),
  interviewId: z.string(),
  candidateEmail: z.string(),
  candidateName: z.string(),
  score: z.number().optional(),
  behavioralNotes: z.string().optional(),
  codeOutput: z.string().optional(),
  behaviorFlags: z
    .object({
      cheating_warnings_count: z.number(),
    })
    .optional(),
  humanFeedback: z.string().nullable().optional(),
  finalDecision: z.enum(["HIRE", "DECLINE", "PENDING"]).default("PENDING"),
});

export type Report = z.infer<typeof ReportSchema>;

export const reportsApi = {
  getReport: async (interviewId: string) => {
    const { data } = await apiClient.get<Report>(`/api/reports/${interviewId}`, {
      'axios-retry': { retries: 0 },
    } as any);
    return data;
  },
  
  // Public endpoint for ephemeral learning reports (Practice/Tutor)
  getPublicReport: async (interviewId: string) => {
    const { data } = await apiClient.get<Report>(`/api/public/reports/${interviewId}`, {
      'axios-retry': { retries: 0 },
    } as any);
    return data;
  },

  // Talent Pool: calls GET /api/reports
  getAllReports: async () => {
    const { data } = await apiClient.get<Report[]>("/api/reports");
    return data;
  },

  // Optimized DB query for top performer
  getTopPerformer: async () => {
    const { data } = await apiClient.get<Report>("/api/reports/top");
    return data;
  },

  addFeedback: async (
    interviewId: string,
    feedback: string,
    decision: "HIRE" | "DECLINE" | "PENDING",
  ) => {
    const { data } = await apiClient.post<Report>(
      `/api/reports/${interviewId}/feedback`,
      {
        humanFeedback: feedback,
        decision,
      },
    );
    return data;
  },
};
