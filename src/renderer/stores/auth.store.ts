import { create } from 'zustand'
import { registerAuthClear, registerAuthGetToken } from '@/lib/api-client'
import type { User, UserRole } from '@shared/schemas/auth.schema'

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    hydrated: boolean
    setAuth: (user: User, token: string) => void
    clearAuth: () => void
    hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    hydrated: false,

    setAuth: async (user, token) => {
        set({ user, token, isAuthenticated: true })
        try {
            await window.owlyn.auth.saveToken(token)
        } catch {
            // Dev mode (browser) — safeStorage unavailable, token stays in memory only
        }
    },

    clearAuth: async () => {
        set({ user: null, token: null, isAuthenticated: false })
        try {
            await window.owlyn.auth.clearToken()
        } catch {
            // Dev mode fallback
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
        } catch {
            set({ hydrated: true })
        }
    },
}))

registerAuthClear(useAuthStore.getState().clearAuth)
registerAuthGetToken(() => useAuthStore.getState().token)

export function useUserRole(): UserRole | null {
    return useAuthStore((s) => s.user?.role ?? null)
}

export function useIsAdmin(): boolean {
    return useAuthStore((s) => s.user?.role === 'ADMIN')
}

export function useIsRecruiter(): boolean {
    const role = useAuthStore((s) => s.user?.role)
    return role === 'ADMIN' || role === 'RECRUITER'
}
