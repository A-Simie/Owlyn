import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LiveKitRoom, 
  useRoomContext,
  useLocalParticipant,
  useTracks,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { RoomEvent, Track, ConnectionState } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { useCandidateStore } from "@/stores/candidate.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useSessionStore } from "@/stores/session.store";
import { useMediaStore } from "@/stores/media.store";
import { candidateApi } from "@/api/candidate.api";
import CodeEditor from "./components/CodeEditor";
import Whiteboard from "./components/Whiteboard";
import Notes from "./components/Notes";
import TranscriptSidebar from "./components/TranscriptSidebar";
import FaceTracker from "./components/FaceTracker";
import AudioWaveform from "./components/AudioWaveform";
import InterviewCompletionModal from "./components/InterviewCompletionModal";

type Tab = "code" | "whiteboard" | "notes";

export default function InterviewPage() {
  const { livekitToken } = useCandidateStore();
  const navigate = useNavigate();

  if (!livekitToken) {
    navigate("/calibration");
    return null;
  }

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      className="h-screen w-full bg-[#0B0B0B]"
    >
      <InterviewInterface />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function InterviewInterface() {
  const navigate = useNavigate();
  const whiteboardRef = useRef<{ getData: () => string | undefined }>(null);
  const forcedEndHandledRef = useRef(false);
  const { elapsedSeconds, tick } = useSessionStore();
  const { 
    addTranscript, 
    setCurrentQuestion, 
    reset: resetInterview, 
    isAiSpeaking, 
    setAiSpeaking 
  } = useInterviewStore();
  const { clearSession, isAssistantMode, accessCode, token } = useCandidateStore();
  const { stopAll } = useMediaStore();
  
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const cameraTracks = useTracks([Track.Source.Camera], { room }).filter((t) => t.participant === localParticipant);
  const localCameraTrack = cameraTracks[0];

  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [isConnected, setIsConnected] = useState(false);
  const [isWidget, setIsWidget] = useState(false);
  const [code, setCode] = useState("// Solution implementation\nfunction solve() {\n\n}");
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("Standby");
  const [showCompletion, setShowCompletion] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const { durationMinutes } = useCandidateStore();

  const toggleWidget = async () => {
    const nextState = !isWidget;
    setIsWidget(nextState);
    if (window.owlyn?.window?.setWidgetMode) {
      await window.owlyn.window.setWidgetMode(nextState);
    }
    // 2. Tell Electron to enable local restrictions
    // if (window.owlyn?.lockdown) {
    //   await window.owlyn.lockdown.toggle(true); // RE-ENABLE THIS FOR FULLSCREEN LOCKDOWN
    // }
  };

  useEffect(() => {
    const syncWidgetMode = async () => {
      if (!window.owlyn?.window?.setWidgetMode) return;

      if (isAssistantMode) {
        setIsWidget(true);
        await window.owlyn.window.setWidgetMode(true);
      } else {
        setIsWidget(false);
        await window.owlyn.window.setWidgetMode(false);
      }
    };

    syncWidgetMode();
  }, [isAssistantMode]);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        switch (msg.type) {
          case "transcript":
            addTranscript({
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              speaker: msg.speaker,
              text: msg.text,
            });
            if (msg.speaker === "ai") setCurrentQuestion(msg.text);
            break;
          case "PROCTOR_WARNING":
            setProctorWarning(msg.message);
            setTimeout(() => setProctorWarning(null), 5000);
            break;
          case "TOOL_HIGHLIGHT":
            setHighlightedLine(msg.line);
            setTimeout(() => setHighlightedLine(null), 3000);
            break;
          case "AI_VISUALIZER_STATUS":
            setAiStatus(msg.status);
            break;
          case "AI_SPEAKING":
            setAiSpeaking(msg.active);
            break;
          case "END_INTERVIEW":
            if (forcedEndHandledRef.current) break;
            forcedEndHandledRef.current = true;
            setProctorWarning(msg.message || "Interview terminated by interviewer.");
            setTimeout(() => setProctorWarning(null), 5000);
            setTimeout(() => {
              void handleEndSession(true);
            }, 300);
            break;
        }
      } catch (err) {
        console.warn("AI command error:", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);

    const checkAndSignal = () => {
      if (room.state === ConnectionState.Connected) {
        const participant = room.localParticipant;
        const encoder = new TextEncoder();
        participant.publishData(
          encoder.encode(JSON.stringify({ event: "USER_JOINED" })), 
          { reliable: true }
        );
        setIsConnected(true);
      }
    };

    const handleDisconnected = () => setIsConnected(false);

    if (room.state === ConnectionState.Connected) checkAndSignal();
    room.on(RoomEvent.Connected, checkAndSignal);

    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Connected, checkAndSignal);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, addTranscript, setCurrentQuestion, setAiSpeaking]);

  useEffect(() => {
    if (localParticipant && isConnected) {
      const encoder = new TextEncoder();
      localParticipant.publishData(
        encoder.encode(JSON.stringify({ event: "TAB_CHANGE", tab: activeTab })), 
        { reliable: true }
      );
    }
  }, [activeTab, localParticipant, isConnected]);

  useEffect(() => {
    useSessionStore.getState().reset();
    const timer = setInterval(() => useSessionStore.getState().tick(), 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const hasPublishedScreenShareTrack = () => {
    if (!localParticipant) return false;
    const publications = Array.from(localParticipant.trackPublications.values());
    return publications.some(
      (publication) =>
        publication.source === Track.Source.ScreenShare &&
        !!publication.track,
    );
  };

  const waitForScreenSharePublication = async (timeoutMs = 3500) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (hasPublishedScreenShareTrack()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return false;
  };

  const publishMedia = async () => {
    if (!localParticipant) return;
    setMediaError(null);

    if (room.state !== ConnectionState.Connected) {
      setMediaError("Session is still connecting. Please wait a few seconds.");
      setIsMediaReady(false);
      return;
    }

    // 0. Lockdown Check: Multi-monitor 
    if (window.owlyn?.platform?.getDisplayCount) {
      try {
        const count = await window.owlyn.platform.getDisplayCount();
        if (count > 1) {
          // setMediaError("Multiple monitors detected. Please disconnect extra displays to proceed.");
          // return; 
          console.warn("Multiple monitors detected during debug mode.");
        }
      } catch (e) {
        console.warn("Display count check failed", e);
      }
    }
    
    let cameraEnabled = false;
    let screenShareEnabled = false;

    // 1. Microphone
    try {
      await localParticipant.setMicrophoneEnabled(true);
    } catch (err) {
      console.error("Microphone capture failed:", err);
      const errorText = String(err).toLowerCase();
      if (
        errorText.includes("engine not connected") ||
        errorText.includes("timeout") ||
        errorText.includes("not connected")
      ) {
        setMediaError("Session connection is not ready yet. Please wait and retry.");
      } else {
        setMediaError("Microphone access denied. Please check your browser permissions.");
      }
      setIsMediaReady(false);
      return;
    }

    // 2. Camera
    try {
      await localParticipant.setCameraEnabled(true);
      cameraEnabled = true;
    } catch (err) {
      console.warn("Camera capture rejected:", err);
    }

    // 3. Screen Share
    try {
      let sourceId: string | undefined;
      if (window.owlyn?.desktop?.getSources) {
        try {
          const sources = await window.owlyn.desktop.getSources();
          const screenSources = sources.filter((s: { name: string; }) => s.name.toLowerCase().includes("screen"));
          const windowSources = sources.filter((s: { name: string; }) => s.name.toLowerCase().includes("window"));
          const source = screenSources[0] || windowSources[0] || sources[0];
          sourceId = source?.id;
        } catch (e) {
          console.warn("Failed to get desktop sources:", e);
        }
      }

      await localParticipant.setScreenShareEnabled(true, { 
        contentHint: "text",
        // @ts-ignore
        deviceId: sourceId 
      });
      screenShareEnabled = await waitForScreenSharePublication();
      if (!screenShareEnabled) {
        const publicationSources = Array.from(localParticipant.trackPublications.values())
          .map((publication) => String(publication.source))
          .join(", ");
        console.warn(`Screen share requested but no published screen track detected. sources=[${publicationSources}]`);
      }
    } catch (err) {
      console.warn("Screen share capture rejected:", err);
      setMediaError("Full screen sharing is required for monitoring. Please allow screen share and retry.");
      setIsMediaReady(false);
      return;
    }

    if (!screenShareEnabled) {
      setMediaError("Screen share is not active. Please start screen share to continue.");
      setIsMediaReady(false);
      return;
    }

    if (!cameraEnabled) {
      console.warn("Camera is not active; continuing with screen-share-only session.");
    }

    setIsMediaReady(true);
  };

  const handleRunCode = async () => {
    if (!room || !localParticipant || room.state !== ConnectionState.Connected) {
      setMediaError("Session connection is not ready yet. Please wait and try Run Code again.");
      return;
    }

    setIsProcessing(true);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ event: "RUN_CODE" }));
      await localParticipant.publishData(data, { reliable: true });
    } catch (err) {
      console.warn("Run Code publish failed:", err);
      setMediaError("Unable to send Run Code signal. Please retry.");
      setIsProcessing(false);
      return;
    }
    setTimeout(() => setIsProcessing(false), 3000);
  };

  const finalizeExit = () => {
    if (window.owlyn?.window?.setWidgetMode) {
      window.owlyn.window.setWidgetMode(false);
    }
    const { isAssistantMode } = useCandidateStore.getState();
    resetInterview();
    useSessionStore.getState().reset();
    clearSession();
    if (isAssistantMode) {
      navigate("/auth?step=candidate-options");
    } else {
      navigate("/analysis");
    }
  };

  const handleEndSession = async (force: boolean = false) => {
    if (isEnding) return;
    if (force || confirm("Are you sure you want to end your interview session?")) {
      setIsEnding(true);

      if (accessCode && token) {
        try {
          await candidateApi.completeInterview(accessCode, token);
        } catch (err) {
          console.warn("Failed to mark interview as completed:", err);
        }
      }

      await room?.disconnect();
      stopAll();
      await candidateApi.releaseLockdown();
      setProctorWarning(null); // Clear any active warnings to remove red overlay
      
      const { isPracticeMode, isAssistantMode } = useCandidateStore.getState();
      if (!isPracticeMode && !isAssistantMode) {
        setShowCompletion(true);
      } else {
        finalizeExit();
      }
    }
  };

  useEffect(() => {
    const remaining = (durationMinutes || 45) * 60 - elapsedSeconds;
    if (remaining <= 0 && isConnected && isMediaReady && !isEnding) {
      handleEndSession(true); // Auto-close when timer hits zero
    }
  }, [elapsedSeconds, durationMinutes, isConnected, isMediaReady, isEnding]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden transition-all duration-500 ${proctorWarning ? "ring-8 ring-inset ring-red-600/30" : ""}`}
    >
      {!isWidget && (
        <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#0D0D0D] z-50">
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                owl
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
                Active Session
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`size-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  {isConnected ? "Live" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {isProcessing && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-8 top-20 z-[60] py-2 px-4 bg-primary/20 border border-primary/30 rounded-full backdrop-blur-md flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 pointer-events-none"
                >
                  <div className="size-2 bg-primary rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                    Owlyn is Reviewing your code...
                  </span>
                  <div className="size-2 bg-primary rounded-full animate-ping" />
                </motion.div>
              </AnimatePresence>
            )}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-black tracking-widest text-primary/60 mb-1">
                Remaining
              </span>
              <span className="text-lg font-mono text-white tracking-widest">
                {formatTime(Math.max(0, (durationMinutes || 45) * 60 - elapsedSeconds))}
              </span>
            </div>
            <button
              onClick={() => handleEndSession()}
              className="px-6 py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
            >
              End Session
            </button>
          </div>
        </header>
      )}

      <AnimatePresence>
        {!isMediaReady && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="max-w-md w-full p-12 text-center space-y-8 bg-[#0D0D0D] border border-white/5 rounded-3xl">
              <div className="size-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-4xl text-primary animate-pulse">lock_open</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Initialization</h2>
                <p className="text-slate-500 text-xs font-light leading-relaxed">
                  To ensure a secure and fair interview environment, please authorize microphone and screen share access.
                </p>
                {mediaError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                      {mediaError}
                    </p>
                  </motion.div>
                )}
              </div>
              <button 
                onClick={publishMedia}
                disabled={!room || room.state !== ConnectionState.Connected}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/10 disabled:opacity-20 flex items-center justify-center gap-3"
              >
                {(!room || room.state !== ConnectionState.Connected) && (
                  <div className="size-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                )}
                Start Secure Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex min-h-0">
        {!isWidget && (
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 relative">
            <div className="flex items-center px-4 gap-1 border-b border-white/5 h-12 bg-black/40">
              <TabButton
                active={activeTab === "code"}
                onClick={() => setActiveTab("code")}
                label="Code Editor"
                icon="code"
              />
              <TabButton
                active={activeTab === "whiteboard"}
                onClick={() => setActiveTab("whiteboard")}
                label="Whiteboard"
                icon="draw"
              />
              <TabButton
                active={activeTab === "notes"}
                onClick={() => setActiveTab("notes")}
                label="Scratchpad"
                icon="description"
              />

              {activeTab === "code" && (
                <div className="ml-auto flex items-center gap-4">
                  <button
                    onClick={handleRunCode}
                    disabled={isProcessing}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      isProcessing 
                        ? "bg-primary/30 text-primary border border-primary/50 animate-pulse cursor-wait shadow-[0_0_20px_rgba(197,159,89,0.3)]" 
                        : "bg-primary text-black hover:brightness-110 active:scale-95 shadow-lg shadow-primary/10"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isProcessing ? "cognition" : "play_arrow"}
                    </span>
                    {isProcessing ? "AI Reviewing Session..." : "Run Code"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {activeTab === "code" && (
                    <div
                      className={`h-full w-full ${
                        isProcessing
                          ? "opacity-40 grayscale-[0.5] transition-all duration-700 blur-[1px]"
                          : "transition-all duration-700"
                      }`}
                    >
                      <CodeEditor
                        value={code}
                        onChange={setCode}
                        highlightedLine={highlightedLine}
                      />
                    </div>
                  )}
                  {activeTab === "whiteboard" && (
                    <Whiteboard ref={whiteboardRef} />
                  )}
                  {activeTab === "notes" && <Notes />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        <div
          className={`${isWidget ? "flex-1" : "w-[360px]"} bg-[#0D0D0D] flex flex-col shrink-0 min-h-0 overflow-y-auto custom-scrollbar border-l border-white/5 z-40`}
        >
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Candidate Feed
                </span>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black shadow-2xl">
                {!isEnding && (
                  <FaceTracker 
                    onWarning={setProctorWarning} 
                    stream={(localCameraTrack?.publication?.track as any)?.mediaStream ?? null} 
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-primary/20 rounded-xl p-6 flex flex-col items-center gap-4">
                <AudioWaveform isActive={isAiSpeaking} color="#c59f59" />
                <div className="text-center">
                  <p className={`text-[10px] text-primary font-black uppercase tracking-[0.4em] ${isAiSpeaking ? "animate-pulse" : ""}`}>
                    {isAiSpeaking ? "Owlyn Speaking" : (aiStatus || "Standby")}
                  </p>
                </div>
              </div>
            </div>

            {!isWidget && (
              <div className="space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Live Transcript
                </span>
                <div className="h-[300px] border border-white/5 rounded-lg bg-black/20 overflow-hidden">
                  <TranscriptSidebar />
                </div>
              </div>
            )}

            {isAssistantMode && isWidget && (
              <button
                onClick={() => handleEndSession(true)}
                className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-900/20"
              >
                <span className="material-symbols-outlined text-sm">power_settings_new</span>
                End Assistant Mode
              </button>
            )}

            {isAssistantMode && !isWidget && (
              <button
                onClick={toggleWidget}
                className="w-full py-3 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">pip</span>
                Toggle Widget
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {proctorWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white h-12 flex items-center justify-center gap-4 shadow-2xl pointer-events-none"
          >
            <span className="material-symbols-outlined text-xl animate-pulse">
              warning
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
              {proctorWarning}
            </span>
            <span className="material-symbols-outlined text-xl animate-pulse">
              warning
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompletion && (
          <InterviewCompletionModal 
            onClose={finalizeExit} 
            candidateName={useCandidateStore.getState().candidateName} 
          />
        )}
      </AnimatePresence>
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
