import { z } from 'zod'

export const WsOutgoingAudioSchema = z.object({
    type: z.literal('audio'),
    data: z.string(),
    sampleRate: z.literal(16000),
})

export const WsOutgoingImageSchema = z.object({
    type: z.literal('image'),
    data: z.string(),
    mimeType: z.literal('image/jpeg'),
})

export const WsFunctionCallSchema = z.object({
    type: z.literal('functionCall'),
    name: z.string(),
    args: z.record(z.unknown()),
})

export const WsInlineDataSchema = z.object({
    type: z.literal('inlineData'),
    mimeType: z.string(),
    data: z.string(),
})

export const WsTranscriptSchema = z.object({
    type: z.literal('transcript'),
    speaker: z.enum(['ai', 'candidate']),
    text: z.string(),
    timestamp: z.string(),
    isInterruption: z.boolean().optional(),
})

export const WsInterruptionSchema = z.object({
    type: z.literal('interruption'),
    reason: z.string().optional(),
})

export const WsIncomingMessageSchema = z.discriminatedUnion('type', [
    WsFunctionCallSchema,
    WsInlineDataSchema,
    WsTranscriptSchema,
    WsInterruptionSchema,
])

export const WsOutgoingMessageSchema = z.discriminatedUnion('type', [
    WsOutgoingAudioSchema,
    WsOutgoingImageSchema,
])

export type WsOutgoingAudio = z.infer<typeof WsOutgoingAudioSchema>
export type WsOutgoingImage = z.infer<typeof WsOutgoingImageSchema>
export type WsFunctionCall = z.infer<typeof WsFunctionCallSchema>
export type WsInlineData = z.infer<typeof WsInlineDataSchema>
export type WsTranscript = z.infer<typeof WsTranscriptSchema>
export type WsInterruption = z.infer<typeof WsInterruptionSchema>
export type WsIncomingMessage = z.infer<typeof WsIncomingMessageSchema>
export type WsOutgoingMessage = z.infer<typeof WsOutgoingMessageSchema>
