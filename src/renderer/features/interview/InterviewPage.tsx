import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useRemoteParticipants,
  useRoomContext,
  useLocalParticipant,
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import {
  ConnectionState,
  LocalAudioTrack,
  LocalVideoTrack,
} from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { useCandidateStore } from "@/stores/candidate.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useMediaStore } from "@/stores/media.store";
import { useSessionStore } from "@/stores/session.store";
import { candidateApi } from "@/api/candidate.api";

// Hooks
import { useInterviewSession } from "./hooks/useInterviewSession";
import { useMediaManager } from "./hooks/useMediaManager";

// Components
import InterviewHeader from "./components/InterviewHeader";
import InterviewSidebar from "./components/InterviewSidebar";
import InterviewInitiationOverlay from "./components/InterviewInitiationOverlay";
import MediaRecoveryModal from "./components/MediaRecoveryModal";
import InterviewCompletionModal from "./components/InterviewCompletionModal";
import CodeEditor from "./components/CodeEditor";
import Whiteboard from "./components/Whiteboard";
import Notes from "./components/Notes";

type Tab = "code" | "whiteboard" | "notes";

export default function InterviewPage() {
  const { livekitToken } = useCandidateStore();
  const navigate = useNavigate();
  const [shouldConnect, setShouldConnect] = useState(true);
  const [isCommenced, setIsCommenced] = useState(false);

  if (!livekitToken) {
    navigate("/calibration");
    return null;
  }

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={shouldConnect}
      className="h-screen w-full bg-[#0B0B0B]"
    >
      <InterviewInterface
        isCommenced={isCommenced}
        setIsCommenced={setIsCommenced}
        shouldConnect={shouldConnect}
        setShouldConnect={setShouldConnect}
      />
      {isCommenced && <RoomAudioRenderer />}
    </LiveKitRoom>
  );
}

function InterviewInterface({
  isCommenced,
  setIsCommenced,
  shouldConnect,
}: {
  isCommenced: boolean;
  setIsCommenced: (v: boolean) => void;
  shouldConnect: boolean;
  setShouldConnect: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const {
    clearSession,
    isAssistantMode,
    accessCode,
    token,
    toolsEnabled,
  } = useCandidateStore();
  const { stopAll } = useMediaStore();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const { reset: resetInterview, isAiSpeaking: isAiSpeakingStore } = useInterviewStore();

  const [isWidget, setIsWidget] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [code, setCode] = useState("// Solution implementation\nfunction solve() {\n\n}");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Modular Hooks
  const {
    isConnected,
    proctorWarning,
    localFaceWarning,
    setLocalFaceWarning,
    pushActivityEvent,
    highlightedLine,
    showMediaRecovery,
    recoveryType,
  } = useInterviewSession(isCommenced, isEnding, (force?: boolean, reason?: string) => handleEndSession(force, reason));

  const {
    isMediaReady,
    isStartingMedia,
    mediaError,
    publishMedia,
  } = useMediaManager();

  const isAiSpeaking = isAiSpeakingStore || remoteParticipants.some((p) => p.isSpeaking);

  const availableTabs = useMemo<Tab[]>(() => {
    const tabs: Tab[] = [];
    if (toolsEnabled.codeEditor) tabs.push("code");
    if (toolsEnabled.whiteboard) tabs.push("whiteboard");
    if (toolsEnabled.notes) tabs.push("notes");
    return tabs;
  }, [toolsEnabled]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (isAssistantMode) setIsWidget(true);
    if (window.owlyn?.window?.setWidgetMode) {
      window.owlyn.window.setWidgetMode(isAssistantMode);
    }
  }, [isAssistantMode]);

  useEffect(() => {
    if (isConnected && isMediaReady && isCommenced && localParticipant) {
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(JSON.stringify({ event: "USER_JOINED" })), { reliable: true });
    }
  }, [isConnected, isMediaReady, isCommenced, localParticipant]);

  // Global safety cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  useEffect(() => {
    if (localParticipant && isConnected) {
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(JSON.stringify({ event: "TAB_CHANGE", tab: activeTab })), { reliable: true });
    }
  }, [activeTab, localParticipant, isConnected]);

  const toggleWidget = async () => {
    const nextState = !isWidget;
    setIsWidget(nextState);
    if (window.owlyn?.window?.setWidgetMode) await window.owlyn.window.setWidgetMode(nextState);
  };

  const handleRunCode = async () => {
    if (isEnding || !localParticipant || room.state !== ConnectionState.Connected) return;
    setIsProcessing(true);
    try {
      const encoder = new TextEncoder();
      await localParticipant.publishData(encoder.encode(JSON.stringify({ event: "RUN_CODE" })), { reliable: true });
    } catch (err) {
      console.warn("Run Code failed:", err);
    }
    setTimeout(() => setIsProcessing(false), 3000);
  };

  const finalizeExit = () => {
    if (window.owlyn?.window?.setWidgetMode) window.owlyn.window.setWidgetMode(false);
    resetInterview();
    useSessionStore.getState().reset();
    clearSession();
    navigate(isAssistantMode ? "/auth?step=candidate-options" : "/analysis");
  };

  const handleEndSession = async (force = false, reason = "USER_ENDED") => {
    if (isEnding) return;
    if (force || confirm("End session?")) {
      setIsEnding(true);
      if (accessCode && token) {
        try { await candidateApi.notifySessionEnded(accessCode, token, reason); } catch {}
        try { await candidateApi.completeInterview(accessCode, token); } catch {}
      }
      if (localParticipant) {
        localParticipant.trackPublications.forEach((pub) => {
          if (pub.track) {
            pub.track.stop();
            if (pub.track instanceof LocalVideoTrack || pub.track instanceof LocalAudioTrack) {
              // @ts-ignore
              localParticipant.unpublishTrack(pub.track);
            }
          }
        });
      }
      await room?.disconnect();
      stopAll();
      await candidateApi.releaseLockdown();
      if (!isAssistantMode) setShowCompletion(true);
      else finalizeExit();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden transition-all duration-500 ${proctorWarning || localFaceWarning ? "ring-8 ring-inset ring-red-600/30" : ""}`}>
      <InterviewInitiationOverlay isCommenced={isCommenced} isEnding={isEnding} shouldConnect={shouldConnect} isConnected={isConnected} isStartingMedia={isStartingMedia} mediaError={mediaError} onPublishMedia={() => publishMedia(() => setIsCommenced(true))} />
      
      <AnimatePresence>
        {isCommenced && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <InterviewHeader isConnected={isConnected} isProcessing={isProcessing} onEndSession={handleEndSession} formatTime={formatTime} isWidget={isWidget} />
            
            <div className="flex-1 flex min-h-0">
              {!isWidget && availableTabs.length > 0 && (
                <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 relative">
                  <div className="flex items-center px-4 gap-1 border-b border-white/5 h-12 bg-black/40">
                    {availableTabs.map((t) => (
                      <TabButton key={t} active={activeTab === t} onClick={() => setActiveTab(t)} label={t.charAt(0).toUpperCase() + t.slice(1)} icon={t === "code" ? "code" : t === "whiteboard" ? "draw" : "description"} />
                    ))}
                    {activeTab === "code" && (
                      <div className="ml-auto flex items-center gap-4">
                        <button onClick={handleRunCode} disabled={isProcessing} className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${isProcessing ? "bg-primary/30 text-primary border border-primary/50 animate-pulse" : "bg-primary text-black hover:brightness-110 shadow-lg"}`}>
                          <span className="material-symbols-outlined text-sm">{isProcessing ? "cognition" : "play_arrow"}</span>
                          {isProcessing ? "AI Reviewing..." : "Run Code"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode="wait">
                      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                        {activeTab === "code" && <div className={`h-full w-full ${isProcessing ? "opacity-40 blur-[1px]" : ""}`}><CodeEditor value={code} onChange={setCode} highlightedLine={highlightedLine} /></div>}
                        {activeTab === "whiteboard" && <Whiteboard />}
                        {activeTab === "notes" && <Notes />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <InterviewSidebar isWidget={isWidget} isEnding={isEnding} isSpeaking={isAiSpeaking} setLocalFaceWarning={setLocalFaceWarning} pushActivityEvent={pushActivityEvent} onEndSession={handleEndSession} onToggleWidget={toggleWidget} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCommenced && (proctorWarning || localFaceWarning) && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white h-12 flex items-center justify-center gap-4 shadow-2xl">
            <span className="material-symbols-outlined text-xl animate-pulse">warning</span>
            <span className="text-[11px] font-black uppercase tracking-[0.4em]">{proctorWarning || localFaceWarning}</span>
            <span className="material-symbols-outlined text-xl animate-pulse">warning</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompletion && <InterviewCompletionModal onClose={finalizeExit} candidateName={useCandidateStore.getState().candidateName} />}
      </AnimatePresence>

      <MediaRecoveryModal isOpen={showMediaRecovery} type={recoveryType} onReshare={() => publishMedia()} onTimeout={() => handleEndSession(true, `Media recovery failed: ${recoveryType}`)} />
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 h-full text-[9px] font-black uppercase tracking-widest transition-all relative ${active ? "text-primary" : "text-slate-500 hover:text-slate-300"}`}>
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  );
}
