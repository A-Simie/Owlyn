import { create } from 'zustand'
import type { TranscriptEntry, IntegritySignal } from '@shared/schemas/interview.schema'

interface InterviewSlice {
    transcript: TranscriptEntry[]
    currentQuestion: string
    integrity: IntegritySignal | null
    isAiSpeaking: boolean
    networkLatency: number
    addTranscript: (entry: TranscriptEntry) => void
    setCurrentQuestion: (q: string) => void
    setIntegrity: (i: IntegritySignal) => void
    setAiSpeaking: (v: boolean) => void
    setNetworkLatency: (ms: number) => void
    reset: () => void
}

export const useInterviewStore = create<InterviewSlice>((set) => ({
    transcript: [],
    currentQuestion: '',
    integrity: null,
    isAiSpeaking: false,
    networkLatency: 0,
    addTranscript: (entry) => set((s) => {
        if (s.transcript.some((t) => t.id === entry.id)) return s
        return { transcript: [...s.transcript, entry] }
    }),
    setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
    setIntegrity: (integrity) => set({ integrity }),
    setAiSpeaking: (isAiSpeaking) => set({ isAiSpeaking }),
    setNetworkLatency: (networkLatency) => set({ networkLatency }),
    reset: () => set({ transcript: [], currentQuestion: '', integrity: null, isAiSpeaking: false, networkLatency: 0 }),
}))
