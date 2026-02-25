import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AuthPage from './features/auth/AuthPage'
import HardwarePage from './features/hardware/HardwarePage'
import LobbyPage from './features/lobby/LobbyPage'
import InterviewPage from './features/interview/InterviewPage'
import AnalysisPage from './features/analysis/AnalysisPage'
import TalentPoolPage from './features/talent/TalentPoolPage'
import AgentCustomizationPage from './features/agent/AgentCustomizationPage'
import SettingsPage from './features/settings/SettingsPage'
import InterviewsListPage from './features/interviews/InterviewsListPage'
import LandingPage from './features/landing/LandingPage'
import AppLayout from './components/AppLayout'

export default function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark')
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                {/* Full-screen pages (no sidebar) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/hardware" element={<HardwarePage />} />
                <Route path="/lobby" element={<LobbyPage />} />

                {/* Pages with sidebar */}
                <Route element={<AppLayout />}>
                    <Route path="/interview" element={<InterviewPage />} />
                    <Route path="/analysis/:sessionId" element={<AnalysisPage />} />
                    <Route path="/analysis" element={<AnalysisPage />} />
                    <Route path="/talent" element={<TalentPoolPage />} />
                    <Route path="/agent" element={<AgentCustomizationPage />} />
                    <Route path="/interviews" element={<InterviewsListPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
