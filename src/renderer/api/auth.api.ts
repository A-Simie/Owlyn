import { apiClient } from '@/lib/api-client'
import { extractApiError } from '@/lib/api-error'
import {
    AuthResponseSchema,
    UserSchema,
    type SignupPayload,
    type LoginPayload,
    type OtpVerifyParams,
    type AuthResponse,
    type User,
} from '@shared/schemas/auth.schema'

async function initiateSignup(payload: SignupPayload): Promise<string> {
    try {
        const { data } = await apiClient.post<string>('/api/auth/signup', payload)
        return data
    } catch (error) {
        throw extractApiError(error)
    }
}

async function verifySignup(params: OtpVerifyParams): Promise<AuthResponse> {
    try {
        const { data } = await apiClient.post('/api/auth/verify-signup', null, {
            params: { otp: params.otp, email: params.email },
        })
        return AuthResponseSchema.parse(data)
    } catch (error) {
        throw extractApiError(error)
    }
}

async function initiateLogin(payload: LoginPayload): Promise<string> {
    try {
        const { data } = await apiClient.post<string>('/api/auth/login', payload)
        return data
    } catch (error) {
        throw extractApiError(error)
    }
}

async function verifyLogin(params: OtpVerifyParams): Promise<AuthResponse> {
    try {
        const { data } = await apiClient.post('/api/auth/verify-login', null, {
            params: { otp: params.otp, email: params.email },
        })
        return AuthResponseSchema.parse(data)
    } catch (error) {
        throw extractApiError(error)
    }
}

async function getCurrentUser(): Promise<User> {
    try {
        const { data } = await apiClient.get('/api/auth/me')
        return UserSchema.parse(data)
    } catch (error) {
        throw extractApiError(error)
    }
}

export const authApi = {
    initiateSignup,
    verifySignup,
    initiateLogin,
    verifyLogin,
    getCurrentUser,
} as const
