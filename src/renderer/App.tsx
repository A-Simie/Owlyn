import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './features/auth/LoginPage'
import SignupPage from './features/auth/SignupPage'
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
import AuthGuard from './components/AuthGuard'
import PublicGuard from './components/PublicGuard'

export default function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark')
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<PublicGuard><LandingPage /></PublicGuard>} />
                <Route path="/auth" element={<PublicGuard><LoginPage /></PublicGuard>} />
                <Route path="/signup" element={<PublicGuard><SignupPage /></PublicGuard>} />

                <Route path="/hardware" element={<AuthGuard><HardwarePage /></AuthGuard>} />
                <Route path="/lobby" element={<AuthGuard><LobbyPage /></AuthGuard>} />

                <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                    <Route path="/interview" element={<InterviewPage />} />
                    <Route path="/analysis/:sessionId" element={<AnalysisPage />} />
                    <Route path="/analysis" element={<AnalysisPage />} />
                    <Route path="/agent" element={<AgentCustomizationPage />} />
                    <Route path="/dashboard" element={<TalentPoolPage />} />
                    <Route path="/interviews" element={<InterviewsListPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
