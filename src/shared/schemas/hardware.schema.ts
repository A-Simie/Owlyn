import { z } from 'zod'

export const DeviceInfoSchema = z.object({
    deviceId: z.string(),
    label: z.string(),
    kind: z.enum(['videoinput', 'audioinput', 'audiooutput']),
})

export const HardwareCheckResultSchema = z.object({
    camera: z.enum(['granted', 'denied', 'pending']),
    microphone: z.enum(['granted', 'denied', 'pending']),
    network: z.object({
        latencyMs: z.number(),
        stability: z.number().min(0).max(100),
        status: z.enum(['excellent', 'good', 'poor', 'disconnected']),
    }),
})

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>
export type HardwareCheckResult = z.infer<typeof HardwareCheckResultSchema>
