import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import "@livekit/components-styles";

import { useSessionStore } from "@/stores/session.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useMediaStore } from "@/stores/media.store";
import { candidateApi } from "@/api";
import { useCandidateStore } from "@/stores/candidate.store";

// Components
import CodeEditor from "./components/CodeEditor";
import Whiteboard from "./components/Whiteboard";
import Notes from "./components/Notes";
import FaceTracker from "./components/FaceTracker";

type Tab = "code" | "whiteboard" | "notes";

export default function InterviewPage() {
  const navigate = useNavigate();
  const { livekitToken, isTutorMode } = useCandidateStore();
  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

  if (!livekitToken) {
    navigate("/lobby");
    return null;
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={livekitToken}
      connect={true}
      audio={true}
      video={false} 
      screen={false}
    >
      <RoomAudioRenderer />
      <InterviewInterface />
    </LiveKitRoom>
  );
}

function InterviewInterface() {
  const navigate = useNavigate();
  const whiteboardRef = useRef<{ getData: () => string | undefined }>(null);
  const { elapsedSeconds, tick } = useSessionStore();
  const { transcript, addTranscript, setCurrentQuestion, reset: resetInterview, isAiSpeaking, setAiSpeaking } = useInterviewStore();
  const { clearSession } = useCandidateStore();
  const { stopAll } = useMediaStore();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const screenShareTrack = tracks.find((t) => t.participant.isLocal);

  // State
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [isConnected, setIsConnected] = useState(false);
  const [isWidget, setIsWidget] = useState(false);
  const [code, setCode] = useState(
    "// Solution implementation\nfunction solve() {\n\n}",
  );
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const { isTutorMode } = useCandidateStore();

  const toggleWidget = async () => {
    const nextState = !isWidget;
    setIsWidget(nextState);
    if (window.owlyn?.window?.setWidgetMode) {
      await window.owlyn.window.setWidgetMode(nextState);
    }
  };

  // 13. Listen for AI Commands (LiveKit Data Channels)
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        let msg;
        try {
          msg = JSON.parse(text);
        } catch (e) {
          // If not JSON, it might be a raw string message
          console.log("Received raw data:", text);
          return;
        }

        if (msg.type === "transcript") {
          addTranscript({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            speaker: msg.speaker,
            text: msg.text,
          });
          if (msg.speaker === "ai") setCurrentQuestion(msg.text);
        }

        if (msg.type === "PROCTOR_WARNING") {
          setProctorWarning(msg.message);
          setTimeout(() => setProctorWarning(null), 5000);
        }

        if (msg.type === "TOOL_HIGHLIGHT") {
          setHighlightedLine(msg.line);
          setTimeout(() => setHighlightedLine(null), 3000);
        }

        if (msg.type === "AI_SPEAKING") {
          setAiSpeaking(msg.active);
        }
      } catch (err) {
        console.warn("Failed to process data message");
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    if (room.state === "connected") {
      setIsConnected(true);
      addTranscript({
        id: "sys-0",
        speaker: "ai",
        text: "Connected to session. The AI agent is observing and will begin momentarily.",
        timestamp: new Date().toISOString()
      });
    }
    
    room.on(RoomEvent.Connected, () => {
      setIsConnected(true);
      // Notify AI we are here
      if (localParticipant) {
        const encoder = new TextEncoder();
        localParticipant.publishData(encoder.encode(JSON.stringify({ event: "USER_JOINED" })), { reliable: true });
      }
    });
    room.on(RoomEvent.Disconnected, () => setIsConnected(false));

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Connected, () => setIsConnected(true));
      room.off(RoomEvent.Disconnected, () => setIsConnected(false));
    };
  }, [room, addTranscript, setCurrentQuestion]);

  // Start Session Logic & 1FPS Publishing
  useEffect(() => {
    const timer = setInterval(tick, 1000);

    const startPublishing = async () => {
      if (!localParticipant) return;

      try {
        // 1. Screen Share @ 1FPS (Doc 2 requirement)
        await localParticipant.setScreenShareEnabled(true, {
          contentHint: "text",
        });

        // 2. Camera @ 1FPS (Proctoring requirement)
        await localParticipant.setCameraEnabled(true, {
          resolution: { width: 640, height: 480 },
          frameRate: 1,
        });

      } catch (err) {
        console.warn("Failed to publish tracks:", err);
      }
    };

    if (isConnected) {
      startPublishing();
      // Lockdown Activation (Only if NOT tutor mode)
      if (!isTutorMode && window.owlyn?.lockdown?.toggle) {
        window.owlyn.lockdown.toggle(true);
      }
    }

    return () => {
      clearInterval(timer);
      stopAll();
      if (!isTutorMode && window.owlyn?.lockdown?.toggle) {
        window.owlyn.lockdown.toggle(false);
      }
    };
  }, [tick, stopAll, localParticipant, isConnected, isTutorMode]);

  const handleEndSession = useCallback(() => {
    room?.disconnect();
    stopAll();
    candidateApi.releaseLockdown();
    
   //clean store
    resetInterview();
    useSessionStore.getState().reset();
    clearSession();
    
    navigate("/analysis");
  }, [navigate, stopAll, room, resetInterview, clearSession]);

  const handleRunReview = async () => {
    setLoading(true);
    // 13. Sending UI Commands (LiveKit Data Channels)
    if (room && localParticipant) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ event: "RUN_CODE" }));
      await localParticipant.publishData(data, { reliable: true });
    }
    setTimeout(() => setLoading(false), 1500);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isWarning = elapsedSeconds >= 40 * 60 && elapsedSeconds < 44 * 60;
  const isCritical = elapsedSeconds >= 44 * 60;

  return (
    <div className={`h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden transition-all duration-300 ${proctorWarning ? "ring-4 ring-inset ring-red-600 animate-pulse" : ""}`}>
      <AnimatePresence>
        {proctorWarning && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="absolute top-0 left-0 w-full h-12 bg-red-600 text-white z-[100] flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest shadow-2xl"
          >
            <span className="material-symbols-outlined">warning</span>
            {proctorWarning}
          </motion.div>
        )}
      </AnimatePresence>

      {!isWidget && (
        <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-10 bg-[#0D0D0D] z-50">
          <div className="flex items-center gap-6">
            <div className="size-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                owl
              </span>
            </div>
            <div className="h-8 w-px bg-white/5 mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                Active Session
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div
                  className={`size-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  {isConnected ? "Connected" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            {isTutorMode && (
               <button
                onClick={toggleWidget}
                className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-primary hover:text-black transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  pip
                </span>
                Toggle Widget
              </button>
            )}
            <div className="flex flex-col items-center">
              <span className={`text-[9px] uppercase font-black tracking-widest mb-1 ${isCritical ? "text-red-500 animate-pulse" : isWarning ? "text-[#c59f59]" : "text-primary"}`}>
                {isCritical ? "Critical" : isWarning ? "Remaining" : "Time"}
              </span>
              <span className={`text-xl font-mono ${isCritical ? "text-red-500" : isWarning ? "text-[#c59f59]" : "text-white"}`}>
                {formatTime(Math.max(0, 45 * 60 - elapsedSeconds))}
              </span>
            </div>
            <button
              onClick={handleEndSession}
              className="px-8 py-3 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-all"
            >
              End Session
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 flex min-h-0 bg-[#0B0B0B]">
        {!isWidget && (
          <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
            <div className="flex items-center px-6 gap-2 border-b border-white/5 h-14 bg-black/20">
              <TabButton
                active={activeTab === "code"}
                onClick={() => setActiveTab("code")}
                label="Code"
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
                label="Notes"
                icon="description"
              />

                {activeTab === "code" && (
                  <div className="ml-auto flex items-center gap-3">
                    {isCopilotLoading && (
                      <span className="text-[10px] text-primary animate-pulse font-bold uppercase tracking-widest">
                        Copilot thinking...
                      </span>
                    )}
                    <button
                      onClick={handleRunReview}
                      disabled={loading}
                      className="flex items-center gap-3 px-6 py-2.5 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-sm transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        "Run Code"
                      )}
                    </button>
                  </div>
                )}
            </div>

            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === "code" && (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <CodeEditor 
                      value={code} 
                      onChange={setCode} 
                      highlightedLine={highlightedLine}
                    />
                  </motion.div>
                )}
                {activeTab === "whiteboard" && (
                  <motion.div
                    key="whiteboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <Whiteboard ref={whiteboardRef} />
                  </motion.div>
                )}
                {activeTab === "notes" && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <Notes />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className={`${isWidget ? "flex-1" : "w-[420px]"} bg-[#0D0D0D] flex flex-col shrink-0 min-h-0`}>
          <div className={`${isWidget ? "p-4 space-y-4" : "p-8 space-y-8"}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Display Share</span>
                <span className="text-primary/50 animate-pulse">Monitoring Active</span>
              </div>
              <div className="relative aspect-video rounded-sm overflow-hidden border border-white/5 bg-black shadow-2xl flex items-center justify-center">
                 {screenShareTrack ? (
                   <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-white/10">desktop_windows</span>
                      <span className="text-[8px] font-black uppercase text-slate-700 tracking-[0.2em]">Source Offline</span>
                   </div>
                 )}
                 <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Secure Stream</span>
                 </div>
              </div>
            </div>

            {!isWidget && (
              <FaceTracker
                onWarning={(msg) => {
                  if (msg) {
                    setProctorWarning(msg);
                    setTimeout(() => setProctorWarning(null), 5000);
                  }
                }}
              />
            )}

            <div className={`space-y-4 ${isWidget ? "bg-white/[0.02] p-4 rounded-sm border border-white/5" : ""}`}>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>AI Agent Visualizer</span>
              </div>
              <div className={`flex flex-col items-center justify-center gap-3 ${isWidget ? "" : "bg-white/[0.02] border border-white/5 rounded-sm p-6"}`}>
                <AudioWaveform isActive={isAiSpeaking} color="#c59f59" />
                <p className="text-[8px] text-slate-500 tracking-widest font-black uppercase">
                  Owlyn Core Intelligence
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 border-t border-white/5">
            {!isWidget && (
              <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Transcript
                </span>
              </div>
            )}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${isWidget ? "p-4 space-y-2" : "p-8 space-y-6"}`}>
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <p className="text-[10px] uppercase tracking-widest font-black">
                    No messages
                  </p>
                </div>
              ) : (
                transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.speaker === "ai" ? "items-start" : "items-end"} space-y-2`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">
                      {msg.speaker === "ai" ? "Owlyn" : "Candidate"}
                    </span>
                    <div
                      className={`max-w-[85%] p-4 rounded-sm text-xs font-light leading-relaxed border ${msg.speaker === "ai" ? "bg-white/[0.03] border-white/5 text-slate-300" : "bg-primary/5 border-primary/20 text-white"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-6 flex items-center gap-3 transition-all rounded-sm text-[10px] font-black uppercase tracking-widest border ${active ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-transparent text-slate-600 hover:text-slate-400"}`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </button>
  );
}
function AudioWaveform({ isActive, color }: { isActive: boolean; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-3 w-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={isActive ? {
            height: [
              Math.random() * 8 + 4,
              Math.random() * 8 + 4,
              Math.random() * 8 + 4
            ]
          } : { height: 4 }}
          transition={isActive ? {
            repeat: Infinity,
            duration: 0.5 + Math.random() * 0.5,
            ease: "easeInOut"
          } : {}}
          className="w-1 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
