import { z } from 'zod'

export const UserRole = {
    ADMIN: 'ADMIN',
    RECRUITER: 'RECRUITER',
    CANDIDATE: 'CANDIDATE',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    role: z.enum(['ADMIN', 'RECRUITER', 'CANDIDATE']),
})

export const AuthResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
})

export const SignupPayloadSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required'),
})

export const LoginPayloadSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
})

export const OtpVerifyParamsSchema = z.object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    email: z.string().email(),
})

export type User = z.infer<typeof UserSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type SignupPayload = z.infer<typeof SignupPayloadSchema>
export type LoginPayload = z.infer<typeof LoginPayloadSchema>
export type OtpVerifyParams = z.infer<typeof OtpVerifyParamsSchema>
