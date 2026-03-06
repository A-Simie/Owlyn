import { apiClient } from '@/lib/api-client'
import type {
    GenerateQuestionsPayload,
    GenerateQuestionsResponse,
    CreateInterviewPayload,
    CreateInterviewResponse,
    InterviewListItem,
} from '@shared/schemas/interview.schema'

export const interviewsApi = {
    generateQuestions: async (payload: GenerateQuestionsPayload) => {
        const { data } = await apiClient.post<GenerateQuestionsResponse>('/api/interviews/generate-questions', payload)
        return data
    },

    createInterview: async (payload: CreateInterviewPayload) => {
        const { data } = await apiClient.post<CreateInterviewResponse>('/api/interviews', payload)
        return data
    },

    getInterviews: async () => {
        const { data } = await apiClient.get<InterviewListItem[]>('/api/interviews')
        return data
    },
}
