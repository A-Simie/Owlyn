import { create } from 'zustand'
import { registerCandidateGetToken } from '@/lib/api-client'

interface CandidateState {
    token: string | null
    livekitToken: string | null
    interviewId: string | null
    accessCode: string | null
    interviewTitle: string | null
    candidateName: string | null
    personaName: string | null
    isPracticeMode: boolean
    isAssistantMode: boolean
    durationMinutes: number
    hydrated: boolean
    
    setSession: (params: {
        token: string
        livekitToken: string
        interviewId: string
        accessCode: string
        title: string
        durationMinutes: number
        candidateName?: string
        personaName?: string
    }) => void
    setPracticeMode: (enabled: boolean) => void
    setAssistantMode: (enabled: boolean) => void
    clearSession: () => void
    hydrate: () => Promise<void>
}

export const useCandidateStore = create<CandidateState>((set) => ({
    token: null,
    livekitToken: null,
    interviewId: null,
    accessCode: null,
    interviewTitle: null,
    candidateName: null,
    personaName: null,
    isPracticeMode: false,
    isAssistantMode: false,
    durationMinutes: 45,
    hydrated: false,

    setSession: async (params) => {
        set({
            token: params.token,
            livekitToken: params.livekitToken,
            interviewId: params.interviewId,
            accessCode: params.accessCode,
            interviewTitle: params.title,
            durationMinutes: params.durationMinutes,
            candidateName: params.candidateName || null,
            personaName: params.personaName || null,
        })
        // Save sensitive token securely
        try {
            await window.owlyn.auth.saveToken(params.token)
        } catch (e) {
            console.warn('Secure storage unavailable', e)
        }
    },

    setPracticeMode: (enabled: boolean) => {
        set({ isPracticeMode: enabled, isAssistantMode: false })
    },

    setAssistantMode: (enabled: boolean) => {
        set({ isAssistantMode: enabled, isPracticeMode: true })
    },

    clearSession: async () => {
        set({
            token: null,
            livekitToken: null,
            interviewId: null,
            accessCode: null,
            interviewTitle: null,
            candidateName: null,
            personaName: null,
            isPracticeMode: false,
            isAssistantMode: false
        })
        try {
            await window.owlyn.auth.clearToken()
        } catch (e) {
            console.warn('Failed to clear secure storage', e)
        }
    },

    hydrate: async () => {
        try {
            const token = await window.owlyn.auth.getToken()
            if (token) {
                set({ token, hydrated: true })
            } else {
                set({ hydrated: true })
            }
        } catch (e) {
            console.warn('Hydration failed', e)
            set({ hydrated: true })
        }
    }
}))

registerCandidateGetToken(() => useCandidateStore.getState().token)
