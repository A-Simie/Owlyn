import { create } from 'zustand'
import { registerAuthClear } from '@/lib/api-client'
import type { User, UserRole } from '@shared/schemas/auth.schema'

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    setAuth: (user: User) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,

    setAuth: (user) => set({ user, isAuthenticated: true }),

    clearAuth: () => set({ user: null, isAuthenticated: false }),
}))

registerAuthClear(useAuthStore.getState().clearAuth)

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
