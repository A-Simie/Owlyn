import { z } from 'zod'

export const PersonaSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2),
    roleTitle: z.string(),
    empathyScore: z.number().min(0).max(100),
    analyticalDepth: z.number().min(0).max(100),
    directnessScore: z.number().min(0).max(100),
    tone: z.string(),
    domainExpertise: z.array(z.string()),
    hasKnowledgeBase: z.boolean(),
})

export const CreatePersonaPayloadSchema = z.object({
    name: z.string().min(2),
    roleTitle: z.string(),
    empathyScore: z.number().min(0).max(100),
    analyticalDepth: z.number().min(0).max(100),
    directnessScore: z.number().min(0).max(100),
    tone: z.string(),
    domainExpertise: z.array(z.string()),
})

export type Persona = z.infer<typeof PersonaSchema>
export type CreatePersonaPayload = z.infer<typeof CreatePersonaPayloadSchema>
