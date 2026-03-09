import { apiClient } from "@/lib/api-client";
import { z } from "zod";

export const ReportSchema = z.object({
  reportId: z.string(),
  interviewId: z.string(),
  candidateEmail: z.string().optional(),
  candidateName: z.string().optional(),
  score: z.number().optional(),
  behavioralNotes: z.string().optional(),
  codeOutput: z.string().optional(),
  behaviorFlags: z
    .object({
      cheating_warnings_count: z.number(),
      details: z.string(),
    })
    .optional(),
  humanFeedback: z.string().nullable().optional(),
  decision: z.enum(["HIRE", "DECLINE"]).nullable().optional(),
});

export type Report = z.infer<typeof ReportSchema>;

export const reportsApi = {
  getReport: async (interviewId: string) => {
    const { data } = await apiClient.get<Report>(`/api/reports/${interviewId}`);
    return data;
  },

  addFeedback: async (
    interviewId: string,
    feedback: string,
    decision: "HIRE" | "DECLINE",
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

  // Talent Pool: needs real endpoint
  getAllReports: async () => {
    const { data } = await apiClient.get<Report[]>("/api/reports");
    return data;
  },
};
