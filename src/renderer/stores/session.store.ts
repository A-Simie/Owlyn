import { create } from 'zustand'
import type { SessionState, SessionConfig, SessionEvent } from '@shared/schemas/session.schema'

interface SessionSlice {
    state: SessionState
    config: SessionConfig | null
    events: SessionEvent[]
    elapsedSeconds: number
    setState: (state: SessionState) => void
    setConfig: (config: SessionConfig) => void
    addEvent: (event: SessionEvent) => void
    tick: () => void
    reset: () => void
}

export const useSessionStore = create<SessionSlice>((set) => ({
    state: 'idle',
    config: null,
    events: [],
    elapsedSeconds: 0,
    setState: (state) => set({ state }),
    setConfig: (config) => set({ config }),
    addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
    tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
    reset: () => set({ state: 'idle', config: null, events: [], elapsedSeconds: 0 }),
}))
