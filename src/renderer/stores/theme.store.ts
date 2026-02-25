import { create } from 'zustand'

type ThemeMode = 'dark' | 'light'

interface ThemeState {
    mode: ThemeMode
    toggle: () => void
    setMode: (mode: ThemeMode) => void
}

function getStoredMode(): ThemeMode {
    try {
        const stored = localStorage.getItem('owlyn-theme')
        if (stored === 'light' || stored === 'dark') return stored
    } catch {
        // localStorage unavailable
    }
    return 'dark'
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: getStoredMode(),
    toggle: () =>
        set((state) => {
            const next = state.mode === 'dark' ? 'light' : 'dark'
            try { localStorage.setItem('owlyn-theme', next) } catch { /* noop */ }
            return { mode: next }
        }),
    setMode: (mode) => {
        try { localStorage.setItem('owlyn-theme', mode) } catch { /* noop */ }
        set({ mode })
    },
}))
