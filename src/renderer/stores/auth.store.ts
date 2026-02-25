import { create } from 'zustand'
import type { User, AuthToken } from '@shared/schemas/auth.schema'

interface AuthState {
    user: User | null
    token: AuthToken | null
    isAuthenticated: boolean
    setAuth: (user: User, token: AuthToken) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
    clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
}))
