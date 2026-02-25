import { z } from 'zod'

export const CandidateSchema = z.object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
    role: z.string(),
    expertise: z.array(z.string()).optional(),
    aiScore: z.number().min(0).max(100),
    status: z.enum(['highly_recommended', 'under_review', 'archived', 'rejected']),
    interviewDate: z.string(),
    avatarUrl: z.string().url().optional(),
})

export const TalentPoolFiltersSchema = z.object({
    role: z.string().optional(),
    minScore: z.number().min(0).max(100).optional(),
    status: z.array(z.string()).optional(),
})

export type Candidate = z.infer<typeof CandidateSchema>
export type TalentPoolFilters = z.infer<typeof TalentPoolFiltersSchema>
