import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api'
import { isTokenExpired } from '@/lib/token'

type GuardStatus = 'hydrating' | 'checking' | 'authenticated' | 'unauthenticated'

export default function AuthGuard({ children }: { children: ReactNode }) {
    const location = useLocation()
    const { setAuth, clearAuth, hydrate, hydrated } = useAuthStore()
    const [status, setStatus] = useState<GuardStatus>(hydrated ? 'checking' : 'hydrating')

    useEffect(() => {
        if (!hydrated) {
            hydrate().then(() => setStatus('checking'))
            return
        }
    }, [hydrated])

    useEffect(() => {
        if (status !== 'checking') return
        let cancelled = false

        async function verify() {
            const currentToken = useAuthStore.getState().token

            if (!currentToken) {
                setStatus('unauthenticated')
                return
            }

            if (isTokenExpired(currentToken)) {
                clearAuth()
                setStatus('unauthenticated')
                return
            }

            try {
                const user = await authApi.getCurrentUser()
                if (!cancelled) {
                    setAuth(user, currentToken)
                    setStatus('authenticated')
                }
            } catch {
                if (!cancelled) {
                    clearAuth()
                    setStatus('unauthenticated')
                }
            }
        }

        verify()
        return () => { cancelled = true }
    }, [status, location.pathname])

    if (status === 'hydrating' || status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 tracking-widest uppercase">
                        {status === 'hydrating' ? 'Loading session' : 'Verifying session'}
                    </span>
                </div>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    return <>{children}</>
}
