import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useRemoteParticipants,
  useRoomContext,
  useLocalParticipant,
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import {

  Track,
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
  const [shouldConnect, setShouldConnect] = useState(false);
  const navigate = useNavigate();

  if (!livekitToken) {
    navigate("/auth?step=candidate-options");
    return null;
  }

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={shouldConnect}
      className="h-screen w-full bg-[#0B0B0B]"
    >
      <InterviewInterfaceWrapper 
        shouldConnect={shouldConnect} 
        setShouldConnect={setShouldConnect} 
      />
    </LiveKitRoom>
  );
}

function InterviewInterfaceWrapper({
  shouldConnect,
  setShouldConnect,
}: {
  shouldConnect: boolean;
  setShouldConnect: (v: boolean) => void;
}) {
  const [isCommenced, setIsCommenced] = useState(false);

  return (
    <>
      <InterviewInterface
        isCommenced={isCommenced}
        setIsCommenced={setIsCommenced}
        shouldConnect={shouldConnect}
        setShouldConnect={setShouldConnect}
      />
      {isCommenced && <RoomAudioRenderer />}
    </>
  );
}

function InterviewInterface({
  isCommenced,
  setIsCommenced,
  shouldConnect,
  setShouldConnect,
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
  
  const signaledJoinedRef = useRef<string | null>(null);
  const forcedEndHandledRef = useRef(false);

  // Modular Hooks
  const {
    publishMedia,
    isMediaReady,
    isStartingMedia,
    mediaError,
  } = useMediaManager();

  const handleEndSession = async (force = false, reason = "Interview completed by candidate") => {
    if (isEnding) return;
    if (force || confirm("End session?")) {
      setIsEnding(true);
      forcedEndHandledRef.current = true;

      if (accessCode && token) {
        try { await candidateApi.notifySessionEnded(accessCode, token, reason); } catch {}
        try { await candidateApi.completeInterview(accessCode, token); } catch {}
      }
      
      // Stop screen share specifically but leave cam/mic for cleaner transition
      useMediaStore.getState().stopScreenShare();
      
      if (localParticipant) {
        localParticipant.trackPublications.forEach((pub) => {
          if (pub.track && pub.source === Track.Source.ScreenShare) {
            localParticipant.unpublishTrack(pub.track);
          }
        });
      }

      await room?.disconnect();
      await candidateApi.releaseLockdown();
      
      if (!isAssistantMode) setShowCompletion(true);
      else finalizeExit();
    }
  };

  const {
    isConnected,
    proctorWarning,
    localFaceWarning,
    setLocalFaceWarning,
    activityEvents,
    pushActivityEvent,
    highlightedLine,
    showMediaRecovery,
    setShowMediaRecovery,
    recoveryType,
  } = useInterviewSession(isCommenced, isEnding, handleEndSession);

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
    const sessionId = (room as any).sid || room.name;
    if (isConnected && isMediaReady && isCommenced && localParticipant && signaledJoinedRef.current !== sessionId) {
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(JSON.stringify({ event: "USER_JOINED" })), { reliable: true });
      signaledJoinedRef.current = sessionId;
      console.log("Interview: Signaled USER_JOINED for session", sessionId);
    }
  }, [isConnected, isMediaReady, isCommenced, localParticipant, room]);

  useEffect(() => {
    if (localParticipant && isConnected) {
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(JSON.stringify({ event: "TAB_CHANGE", tab: activeTab })), { reliable: true });
    }
  }, [activeTab, localParticipant, isConnected]);

  // Cleanup all media on unmount
  useEffect(() => {
    useSessionStore.getState().reset();
    return () => {
      // Don't stop all (cam/mic), just stop the screen share to preserve setup state
      useMediaStore.getState().stopScreenShare();
      useSessionStore.getState().reset();
    };
  }, []);

  const finalizeExit = () => {
    resetInterview();
    useSessionStore.getState().reset();
    useMediaStore.getState().stopAll();
    clearSession();
    navigate("/auth?step=candidate-options");
  };

  const toggleWidget = async () => {
    const newState = !isWidget;
    setIsWidget(newState);
    if (window.owlyn?.window?.setWidgetMode) {
      await window.owlyn.window.setWidgetMode(newState);
    }
  };

  const handleRunCode = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (localParticipant) {
        const encoder = new TextEncoder();
        localParticipant.publishData(encoder.encode(JSON.stringify({ event: "RUN_CODE", code })), { reliable: true });
      }
      setTimeout(() => setIsProcessing(false), 2000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden transition-all duration-500 ${proctorWarning || localFaceWarning ? "ring-8 ring-inset ring-red-600/30" : ""}`}>
      <InterviewInitiationOverlay 
        isCommenced={isCommenced} 
        isEnding={isEnding} 
        shouldConnect={shouldConnect} 
        isConnected={isConnected} 
        isStartingMedia={isStartingMedia} 
        mediaError={mediaError} 
        onPublishMedia={() => publishMedia(() => setIsCommenced(true))} 
        setShouldConnect={setShouldConnect}
      />
      
      <AnimatePresence>
        {isCommenced && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <InterviewHeader 
               isConnected={isConnected} 
               isProcessing={isProcessing}
               onEndSession={() => handleEndSession()} 
               formatTime={formatTime}
            />
            
            <div className="flex-1 flex min-h-0">
              {!isWidget && (
                <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                  <div className="h-14 border-b border-white/5 bg-white/[0.02] flex items-center px-6 gap-2 shrink-0">
                    {availableTabs.map((tab) => (
                      <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} label={tab} icon={tab === "code" ? "code" : tab === "whiteboard" ? "palette" : "description"} />
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

      <MediaRecoveryModal 
        isOpen={showMediaRecovery} 
        type={recoveryType} 
        onReshare={() => publishMedia()} 
        onTimeout={() => handleEndSession(true, `Media recovery failed: ${recoveryType}`)} 
        error={mediaError}
        isStarting={isStartingMedia}
      />
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 h-full text-[9px] font-black uppercase tracking-widest transition-all relative ${active ? "text-primary" : "text-slate-500 hover:text-slate-300"}`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
      {active && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  );
}
