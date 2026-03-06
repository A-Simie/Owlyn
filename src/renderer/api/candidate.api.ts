import { apiClient } from '@/lib/api-client'
import type {
    ValidateCodePayload,
    ValidateCodeResponse,
} from '@shared/schemas/candidate.schema'

export const candidateApi = {
    healthCheck: async () => {
        const { data } = await apiClient.get<{ status: string; timestamp: number }>('/api/health')
        return data
    },

    validateCode: async (payload: ValidateCodePayload) => {
        const { data } = await apiClient.post<ValidateCodeResponse>('/api/interviews/validate-code', payload)
        return data
    },

    initiateLockdown: async (accessCode: string, guestToken: string) => {
        const { data } = await apiClient.put<{ message: string }>(
            `/api/interviews/${accessCode}/status/active`,
            null,
            { headers: { Authorization: `Bearer ${guestToken}` } }
        )
        return data
    },
}
