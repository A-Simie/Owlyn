import { z } from 'zod'

export const LoginCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const AuthTokenSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.number(),
})

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['candidate', 'recruiter', 'admin']),
    avatarUrl: z.string().url().optional(),
})

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>
export type AuthToken = z.infer<typeof AuthTokenSchema>
export type User = z.infer<typeof UserSchema>
