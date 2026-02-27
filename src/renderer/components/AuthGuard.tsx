import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api'
import { isApiError } from '@/lib/api-error'

type GuardStatus = 'checking' | 'authenticated' | 'unauthenticated'

export default function AuthGuard({ children }: { children: ReactNode }) {
    const location = useLocation()
    const { isAuthenticated, setAuth, clearAuth } = useAuthStore()
    const [status, setStatus] = useState<GuardStatus>(isAuthenticated ? 'authenticated' : 'checking')

    useEffect(() => {
        let cancelled = false

        async function verify() {
            try {
                const user = await authApi.getCurrentUser()
                if (!cancelled) {
                    setAuth(user)
                    setStatus('authenticated')
                }
            } catch (error) {
                if (!cancelled) {
                    if (isApiError(error) && error.isUnauthorized) {
                        clearAuth()
                    }
                    setStatus('unauthenticated')
                }
            }
        }

        verify()
        return () => { cancelled = true }
    }, [location.pathname])

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 tracking-widest uppercase">Verifying session</span>
                </div>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    return <>{children}</>
}
