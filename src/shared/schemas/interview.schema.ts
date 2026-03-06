import { z } from 'zod'

export const GenerateQuestionsPayloadSchema = z.object({
    jobTitle: z.string().min(2),
    instructions: z.string().optional(),
    questionCount: z.number().int().min(1).max(20).optional(),
})

export const ToolsEnabledSchema = z.object({
    codeEditor: z.boolean().optional(),
    whiteboard: z.boolean().optional(),
    notes: z.boolean().optional(),
})

export const CreateInterviewPayloadSchema = z.object({
    title: z.string().min(3, 'Title is too short'),
    durationMinutes: z.number().int().min(5).max(180).default(45),
    toolsEnabled: ToolsEnabledSchema.optional(),
    aiInstructions: z.string().optional(),
    generatedQuestions: z.string().optional(),
    personaId: z.string().uuid().optional(),
})

export const GenerateQuestionsResponseSchema = z.object({
    draftedQuestions: z.string(),
})

export const CreateInterviewResponseSchema = z.object({
    interviewId: z.string(),
    title: z.string(),
    accessCode: z.string(),
    status: z.string(),
})

export const InterviewListItemSchema = z.object({
    interviewId: z.string(),
    title: z.string(),
    accessCode: z.string(),
    status: z.string(),
})

export type GenerateQuestionsPayload = z.infer<typeof GenerateQuestionsPayloadSchema>
export type ToolsEnabled = z.infer<typeof ToolsEnabledSchema>
export type CreateInterviewPayload = z.infer<typeof CreateInterviewPayloadSchema>
export type GenerateQuestionsResponse = z.infer<typeof GenerateQuestionsResponseSchema>
export type CreateInterviewResponse = z.infer<typeof CreateInterviewResponseSchema>
export type InterviewListItem = z.infer<typeof InterviewListItemSchema>
