import { useState, useEffect, useRef, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { useRemoteParticipants, useRoomContext, useLocalParticipant, useTracks, LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { useCandidateStore } from "@/stores/candidate.store";
import { useSessionStore } from "@/stores/session.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useMediaStore } from "@/stores/media.store";
import { candidateApi } from "@/api/candidate.api";
import MediaRecoveryModal, { MediaType } from "./components/MediaRecoveryModal";
import CodeEditor from "./components/CodeEditor";
import Whiteboard from "./components/Whiteboard";
import Notes from "./components/Notes";
import TranscriptSidebar from "./components/TranscriptSidebar";
import FaceTracker from "./components/FaceTracker";
import AudioWaveform from "./components/AudioWaveform";
import InterviewCompletionModal from "./components/InterviewCompletionModal";

type Tab = "code" | "whiteboard" | "notes";

type ActivityEvent = {
  id: string;
  source: "proctor" | "workspace" | "local";
  message: string;
  timestamp: string;
};

export default function InterviewPage() {
  const { livekitToken, token, accessCode } = useCandidateStore();
  const navigate = useNavigate();
  const [shouldConnect, setShouldConnect] = useState(true); // Auto-connect in background
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
  setShouldConnect 
}: { 
  isCommenced: boolean, 
  setIsCommenced: (v: boolean) => void,
  shouldConnect: boolean,
  setShouldConnect: (v: boolean) => void
}) {
  const navigate = useNavigate();
  const whiteboardRef = useRef<{ getData: () => string | undefined }>(null);
  const forcedEndHandledRef = useRef(false);
  const { elapsedSeconds, tick } = useSessionStore();
  const { 
    addTranscript, 
    setCurrentQuestion, 
    reset: resetInterview,
    isAiSpeaking: isAiSpeakingStore,
    setAiSpeaking 
  } = useInterviewStore();
  const remoteParticipants = useRemoteParticipants();
  const isAiSpeakingLive = remoteParticipants.some(p => p.isSpeaking);
  const isSpeaking = isAiSpeakingStore || isAiSpeakingLive;
  const { clearSession, isAssistantMode, accessCode, token, durationMinutes, toolsEnabled } = useCandidateStore();
  const { stopAll } = useMediaStore();
  
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const cameraTracks = useTracks([Track.Source.Camera], { room }).filter((t) => t.participant === localParticipant);
  const localCameraTrack = cameraTracks[0];

  const availableTabs = useMemo<Tab[]>(() => {
    const tabs: Tab[] = [];
    if (toolsEnabled.codeEditor) tabs.push("code");
    if (toolsEnabled.whiteboard) tabs.push("whiteboard");
    if (toolsEnabled.notes) tabs.push("notes");
    return tabs;
  }, [toolsEnabled]);

  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [isConnected, setIsConnected] = useState(false);
  const [isWidget, setIsWidget] = useState(false);
  const [code, setCode] = useState("// Solution implementation\nfunction solve() {\n\n}");
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [localFaceWarning, setLocalFaceWarning] = useState<string | null>(null);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const [showCompletion, setShowCompletion] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isStartingMedia, setIsStartingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [showMediaRecovery, setShowMediaRecovery] = useState(false);
  const [recoveryType, setRecoveryType] = useState<MediaType>("screen");

  useEffect(() => {
    if (availableTabs.length === 0) {
      return;
    }

    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  const pushActivityEvent = (source: ActivityEvent["source"], message: string) => {
    const cleanMessage = (message || "").trim();
    if (!cleanMessage) return;

    setActivityEvents((current) => {
      const next: ActivityEvent[] = [
        {
          id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source,
          message: cleanMessage,
          timestamp: new Date().toISOString(),
        },
        ...current,
      ];
      return next.slice(0, 10);
    });
  };

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
        const raw = new TextDecoder().decode(payload);
        
        let msg: any;
        try {
          msg = JSON.parse(raw);
        } catch {
          // Fallback: If it's a raw string, assume it's a transcript from the AI
          if (raw.trim()) {
            addTranscript({
              id: `raw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              timestamp: new Date().toISOString(),
              speaker: "ai",
              text: raw.trim(),
            });
            setCurrentQuestion(raw.trim());
          }
          return;
        }

        const type = msg.type || msg.event;
        const text = msg.text || msg.content || msg.message || msg.transcript || msg.dialogue;

        console.log("Data Received:", { type, text, msg });

        if (text && (type === "transcript" || type === "text" || type === "speech" || type === "assistant_message" || !type)) {
          addTranscript({
            id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date().toISOString(),
            speaker: msg.speaker === "candidate" ? "candidate" : "ai",
            text: text,
          });
          if (msg.speaker !== "candidate") setCurrentQuestion(text);
          return;
        }

        switch (type) {
          case "PROCTOR_WARNING":
            setProctorWarning(msg.message);
            pushActivityEvent("proctor", msg.message || "Proctor warning detected");
            setTimeout(() => setProctorWarning(null), 5000);
            break;
          case "PROCTOR_ACTIVITY":
            pushActivityEvent("proctor", msg.message || "Proctor activity detected");
            break;
          case "WORKSPACE_ALERT":
            pushActivityEvent("workspace", msg.message || "Workspace activity detected");
            break;
          case "TOOL_HIGHLIGHT":
            setHighlightedLine(msg.line);
            setTimeout(() => setHighlightedLine(null), 3000);
            break;
          case "AI_SPEAKING":
            setAiSpeaking(msg.active);
            break;
          case "END_INTERVIEW":
            if (forcedEndHandledRef.current) break;
            forcedEndHandledRef.current = true;
            setSessionEnded(true);
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

    const handleTranscription = (transcription: any) => {
      if (!transcription?.segments) return;
      
      transcription.segments.forEach((segment: any) => {
        const text = segment.text?.trim();
        if (!text) return;

        const isLocal = transcription.participantIdentity === room?.localParticipant?.identity;
        // Use segment ID if available, otherwise fallback to a stable ID for the utterance
        const transcriptId = segment.id || `utm-${transcription.participantIdentity}-${Math.floor(segment.startTime / 100)}`;
        
        console.log(`[Transcription] ${isLocal ? "CANDIDATE" : "AI"} [id=${transcriptId}] [final=${segment.final}]: ${text}`);

        addTranscript({
          id: transcriptId,
          timestamp: new Date().toISOString(),
          speaker: isLocal ? "candidate" : "ai",
          text: text,
        });
        
        if (!isLocal) {
          // Update the "Owlyn Speaking" text immediately for better feedback
          setCurrentQuestion(text);
        }
      });
    };

    const handleTrackUnpublished = (publication: any) => {
      const source = publication.source || publication.track?.source;
      console.warn(`[Media] Track unpublished: source=${source}`, { publication, source });
      
      if (source === Track.Source.ScreenShare) {
        setRecoveryType("screen");
        setShowMediaRecovery(true);
      } else if (source === Track.Source.Camera) {
        setRecoveryType("camera");
        setShowMediaRecovery(true);
      } else if (source === Track.Source.Microphone) {
        setRecoveryType("mic");
        setShowMediaRecovery(true);
      }
    };

    const handleTrackMuted = (publication: any) => {
       const source = publication.source || publication.track?.source;
       console.warn(`[Media] Track muted: source=${source}`, { publication, source });
       // We treat muting of screen share or camera as a recovery event
       if (source === Track.Source.ScreenShare || source === Track.Source.Camera) {
          setRecoveryType(source === Track.Source.ScreenShare ? "screen" : "camera");
          setShowMediaRecovery(true);
       }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
    room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    room.on(RoomEvent.TrackMuted, handleTrackMuted);

    // Heartbeat check for media integrity
    console.log("[Media Integrity] Heartbeat started.");
    const integrityInterval = setInterval(() => {
      if (!isCommenced || !localParticipant) return;
      
      const publications = Array.from(localParticipant.trackPublications.values());
      const screenPub = publications.find(p => p.source === Track.Source.ScreenShare);
      const isSharing = !!screenPub && !screenPub.isMuted && !!screenPub.track;
      
      if (!isSharing && !showMediaRecovery) {
        console.warn(`[Media Integrity] Screen share lost! (isCommenced=${isCommenced}, showRecovery=${showMediaRecovery})`);
        setRecoveryType("screen");
        setShowMediaRecovery(true);
      }
    }, 1500);

    const checkAndSignal = () => {
      if (room.state === ConnectionState.Connected) {
        setIsConnected(true);
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setShowMediaRecovery(false);
    };

    if (room.state === ConnectionState.Connected) checkAndSignal();
    room.on(RoomEvent.Connected, checkAndSignal);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
      room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
      room.off(RoomEvent.TrackMuted, handleTrackMuted);
      clearInterval(integrityInterval);
      room.off(RoomEvent.Connected, checkAndSignal);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, addTranscript, setCurrentQuestion, setAiSpeaking, isCommenced]);

  // Handle Session Start Signaling - Only when connected, media ready, AND user clicks COMMENCE
  useEffect(() => {
    if (isConnected && isMediaReady && isCommenced && localParticipant && room.state === ConnectionState.Connected) {
      const encoder = new TextEncoder();
      localParticipant.publishData(
        encoder.encode(JSON.stringify({ event: "USER_JOINED" })), 
        { reliable: true }
      );
      console.log("Session signaled: USER_JOINED");
    }
  }, [isConnected, isMediaReady, isCommenced, localParticipant, room.state]);

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

  const waitForScreenSharePublication = async (timeoutMs = 30000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (hasPublishedScreenShareTrack()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return false;
  };

  const publishMedia = async () => {
    if (!localParticipant) return;
    setIsStartingMedia(true);
    setMediaError(null);

    try {
      // 1. Microphone
      await localParticipant.setMicrophoneEnabled(true);
      
      // 2. Camera
      await localParticipant.setCameraEnabled(true);
      
      // 3. Screen Share
      let sourceId: string | undefined;
      if (window.owlyn?.desktop?.getSources) {
        try {
          const sources = await window.owlyn.desktop.getSources();
          const screenSources = sources.filter((s: { name: string; }) => s.name.toLowerCase().includes("screen"));
          const source = screenSources[0] || sources[0];
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

      const screenShareEnabled = await waitForScreenSharePublication();
      if (!screenShareEnabled) {
         console.warn("Screen share track not confirmed. User might have cancelled.");
         setMediaError("Screen share authorization cancelled. This session requires screen monitoring.");
         setIsStartingMedia(false);
         setIsMediaReady(false);
         return;
      }

      setIsMediaReady(true);
      setIsStartingMedia(false);
      setIsCommenced(true);
      setShowMediaRecovery(false);
    } catch (err) {
      console.error("Media publication failed:", err);
      setMediaError("Failed to authorize media devices. Please ensure permissions are granted.");
      setIsStartingMedia(false);
    }
  };

  // Removed auto-activation useEffect to satisfy browser's "Transient Activation" requirement

  const handleRunCode = async () => {
    if (isEnding || sessionEnded) {
      return;
    }

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

  const handleEndSession = async (force: boolean = false, reason: string = "USER_ENDED") => {
    if (isEnding) return;
    if (force || confirm("Are you sure you want to end your interview session?")) {
      setIsEnding(true);
      setSessionEnded(true);

      if (accessCode && token) {
        try {
          await candidateApi.notifySessionEnded(accessCode, token, reason);
        } catch (err) {
          console.warn("Failed to notify session end:", err);
        }

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

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden transition-all duration-500 ${proctorWarning || localFaceWarning ? "ring-8 ring-inset ring-red-600/30" : ""}`}
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
                {formatTime(Math.max(0, (durationMinutes || 30) * 60 - elapsedSeconds))}
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
        {!isCommenced && !isEnding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
          >
            <div className="max-w-md w-full p-12 text-center space-y-8 bg-[#0D0D0D] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
               {(isStartingMedia || (shouldConnect && !isConnected)) && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "linear" }}
                  className="absolute top-0 left-0 h-1 bg-primary/40 shadow-[0_0_10px_rgba(197,159,89,0.5)]"
                />
              )}
              
              <div className="space-y-4">
                <div className="size-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                   <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                     owl
                   </span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {!shouldConnect ? "Interview Portal" : "Commencing Session"}
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                  {!shouldConnect 
                    ? "Establish connection and begin session" 
                    : !isConnected 
                      ? "Establishing secure connection..." 
                      : "Syncing media & transcripts..."}
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

              {!isCommenced && (
                <div className="w-full">
                  {!isConnected ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                       <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 animate-pulse">
                         Establishing Secure Connection...
                       </span>
                    </div>
                  ) : (
                    <button 
                      onClick={publishMedia}
                      disabled={isStartingMedia}
                      className="group relative w-full py-5 bg-primary text-black font-black uppercase tracking-[0.3em] text-[13px] rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_50px_rgba(197,159,89,0.3)] flex items-center justify-center gap-4 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      {isStartingMedia ? (
                        <>
                          <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span className="animate-pulse">Initializing...</span>
                        </>
                      ) : (
                        <>
                          Enter Session
                          <span className="material-symbols-outlined text-xl">login</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex min-h-0">
        {!isWidget && availableTabs.length > 0 && (
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 relative">
            <div className="flex items-center px-4 gap-1 border-b border-white/5 h-12 bg-black/40">
              {toolsEnabled.codeEditor && (
                <TabButton
                  active={activeTab === "code"}
                  onClick={() => setActiveTab("code")}
                  label="Code Editor"
                  icon="code"
                />
              )}
              {toolsEnabled.whiteboard && (
                <TabButton
                  active={activeTab === "whiteboard"}
                  onClick={() => setActiveTab("whiteboard")}
                  label="Whiteboard"
                  icon="draw"
                />
              )}
              {toolsEnabled.notes && (
                <TabButton
                  active={activeTab === "notes"}
                  onClick={() => setActiveTab("notes")}
                  label="Scratchpad"
                  icon="description"
                />
              )}

              {toolsEnabled.codeEditor && activeTab === "code" && (
                <div className="ml-auto flex items-center gap-4">
                  <button
                    onClick={handleRunCode}
                    disabled={isProcessing || isEnding || sessionEnded}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      isProcessing || isEnding || sessionEnded
                        ? "bg-primary/30 text-primary border border-primary/50 animate-pulse cursor-wait shadow-[0_0_20px_rgba(197,159,89,0.3)]" 
                        : "bg-primary text-black hover:brightness-110 active:scale-95 shadow-lg shadow-primary/10"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isProcessing ? "cognition" : sessionEnded ? "block" : "play_arrow"}
                    </span>
                    {isProcessing ? "AI Reviewing Session..." : sessionEnded ? "Session Ended" : "Run Code"}
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
                  {toolsEnabled.codeEditor && activeTab === "code" && (
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
                  {toolsEnabled.whiteboard && activeTab === "whiteboard" && (
                    <Whiteboard ref={whiteboardRef} />
                  )}
                  {toolsEnabled.notes && activeTab === "notes" && <Notes />}
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
                    onWarning={(message) => {
                      setLocalFaceWarning(message);
                      if (message) {
                        pushActivityEvent("local", message);
                      }
                    }} 
                    stream={(localCameraTrack?.publication?.track as any)?.mediaStream ?? null} 
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-primary/20 rounded-xl p-6 flex flex-col items-center gap-4">
                <AudioWaveform isActive={isSpeaking} color="#c59f59" />
                <div className="text-center">
                  <p className={`text-[10px] text-primary font-black uppercase tracking-[0.4em] ${isSpeaking ? "animate-pulse" : ""}`}>
                    {isSpeaking ? "Owlyn Speaking" : "Standby"}
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
        {isCommenced && (proctorWarning || localFaceWarning) && (
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
              {proctorWarning || localFaceWarning}
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

      <MediaRecoveryModal 
        isOpen={showMediaRecovery}
        type={recoveryType}
        onReshare={publishMedia}
        onTimeout={() => handleEndSession(true, `Media recovery failed: ${recoveryType}`)}
      />
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
