import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useMediaStore } from '@/stores/media.store'
import Sidebar from './Sidebar'

export default function AppLayout() {
    useEffect(() => {
        // Automatically kill any orphan media when returning to the dashboard/management area
        useMediaStore.getState().stopAll()
    }, [])

    return (
        <div className="flex min-h-screen bg-[#12100d]">
            <Sidebar />
            <main className="flex-1 ml-56 min-h-screen overflow-y-auto">
                <Outlet />
            </main>
        </div>
    )
}
