import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./features/auth/LoginPage";
import SignupPage from "./features/auth/SignupPage";
import CalibrationPage from "./features/calibration/CalibrationPage";
import HardwarePage from "./features/hardware/HardwarePage";
import LobbyPage from "./features/lobby/LobbyPage";
import InterviewPage from "./features/interview/InterviewPage";
import AnalysisPage from "./features/analysis/AnalysisPage";
import TalentPoolPage from "./features/talent/TalentPoolPage";
import AgentCustomizationPage from "./features/agent/AgentCustomizationPage";
import SettingsPage from "./features/settings/SettingsPage";
import InterviewsListPage from "./features/interviews/InterviewsListPage";
import MonitoringPage from "./features/interviews/MonitoringPage";
import LandingPage from "./features/landing/LandingPage";
import AssistantLoadingPage from "./features/assistant/LoadingPage";
import AssistantPage from "./features/assistant/AssistantPage";
import AppLayout from "./components/AppLayout";
import WorkspaceGuard from "./components/WorkspaceGuard";
import AppGuard from "./components/AppGuard";

import CandidateGuard from "./components/CandidateGuard";

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppGuard>
              <LandingPage />
            </AppGuard>
          }
        />
        <Route
          path="/auth"
          element={
            <AppGuard>
              <LoginPage />
            </AppGuard>
          }
        />
        <Route
          path="/signup"
          element={
            <AppGuard>
              <SignupPage />
            </AppGuard>
          }
        />

        <Route
          path="/assistant-loading"
          element={
            <AppGuard>
              <AssistantLoadingPage />
            </AppGuard>
          }
        />
        <Route
          path="/assistant"
          element={
            <CandidateGuard>
              <AssistantPage />
            </CandidateGuard>
          }
        />
        <Route
          path="/calibration"
          element={
            <CandidateGuard>
              <CalibrationPage />
            </CandidateGuard>
          }
        />
        <Route
          path="/hardware"
          element={
            <CandidateGuard>
              <HardwarePage />
            </CandidateGuard>
          }
        />
        <Route
          path="/lobby"
          element={
            <CandidateGuard>
              <LobbyPage />
            </CandidateGuard>
          }
        />
        <Route
          path="/interview"
          element={
            <CandidateGuard>
              <InterviewPage />
            </CandidateGuard>
          }
        />

        <Route
          element={
            <WorkspaceGuard>
              <AppLayout />
            </WorkspaceGuard>
          }
        >
          <Route path="/analysis/:sessionId" element={<AnalysisPage />} />
          <Route path="/monitor/:interviewId" element={<MonitoringPage />} />
          <Route path="/agent" element={<AgentCustomizationPage />} />
          <Route path="/dashboard" element={<TalentPoolPage />} />
          <Route path="/interviews" element={<InterviewsListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
