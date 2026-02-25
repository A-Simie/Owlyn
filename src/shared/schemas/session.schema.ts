import { z } from 'zod'

export const SessionStateSchema = z.enum([
    'idle',
    'calibrating',
    'lobby',
    'live',
    'analyzing',
    'complete',
])

export const SessionConfigSchema = z.object({
    sessionId: z.string(),
    candidateName: z.string(),
    role: z.string(),
    agentPersona: z.string().optional(),
    startedAt: z.string().datetime().optional(),
})

export const SessionEventSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    type: z.string(),
    timestamp: z.string().datetime(),
    payload: z.record(z.unknown()),
})

export type SessionState = z.infer<typeof SessionStateSchema>
export type SessionConfig = z.infer<typeof SessionConfigSchema>
export type SessionEvent = z.infer<typeof SessionEventSchema>
