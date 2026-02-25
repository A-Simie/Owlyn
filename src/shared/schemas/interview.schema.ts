import { z } from 'zod'

export const TranscriptEntrySchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    speaker: z.enum(['ai', 'candidate']),
    text: z.string(),
    isKeyMoment: z.boolean().optional(),
    aiNote: z.string().optional(),
})

export const CompetencyScoreSchema = z.object({
    technical: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    cultural: z.number().min(0).max(100),
})

export const IntegritySignalSchema = z.object({
    eyeTracking: z.enum(['locked', 'wandering', 'lost']),
    focusLevel: z.enum(['high', 'medium', 'low']),
    ambientNoise: z.enum(['silent', 'low', 'moderate', 'loud']),
    verified: z.boolean(),
})

export const AnalysisResultSchema = z.object({
    sessionId: z.string(),
    candidateName: z.string(),
    role: z.string(),
    interviewDate: z.string(),
    overallScore: z.number().min(0).max(100),
    competency: CompetencyScoreSchema,
    integrity: IntegritySignalSchema,
    strengths: z.array(z.string()),
    growthAreas: z.array(z.string()),
    aiSummary: z.string(),
    transcript: z.array(TranscriptEntrySchema),
})

export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>
export type CompetencyScore = z.infer<typeof CompetencyScoreSchema>
export type IntegritySignal = z.infer<typeof IntegritySignalSchema>
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>
