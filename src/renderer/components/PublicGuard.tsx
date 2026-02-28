import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api'
import { isTokenExpired } from '@/lib/token'

type Status = 'checking' | 'authenticated' | 'guest'

export default function PublicGuard({ children }: { children: ReactNode }) {
    const { hydrate, hydrated } = useAuthStore()
    const [status, setStatus] = useState<Status>('checking')

    useEffect(() => {
        let cancelled = false

        async function check() {
            if (!hydrated) {
                await hydrate()
            }

            const token = useAuthStore.getState().token
            if (!token || isTokenExpired(token)) {
                if (!cancelled) setStatus('guest')
                return
            }

            try {
                const user = await authApi.getCurrentUser()
                if (!cancelled) {
                    useAuthStore.getState().setAuth(user, token)
                    setStatus('authenticated')
                }
            } catch {
                if (!cancelled) setStatus('guest')
            }
        }

        check()
        return () => { cancelled = true }
    }, [hydrated])

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (status === 'authenticated') {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
