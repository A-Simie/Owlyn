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

const passwordSchema = z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character')

export const SignupPayloadSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: passwordSchema,
    fullName: z.string().min(1, 'Full name is required'),
    // role: z.enum(['ADMIN', 'RECRUITER', 'CANDIDATE']),
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
