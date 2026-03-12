import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  VideoConference,
  TrackReference,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { RoomEvent, DataPacket_Kind, Track } from "livekit-client";
import "@livekit/components-styles";

import { useSessionStore } from "@/stores/session.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useMediaStore } from "@/stores/media.store";
import { candidateApi } from "@/api";

// Components
import CodeEditor from "./components/CodeEditor";
import Whiteboard from "./components/Whiteboard";
import Notes from "./components/Notes";
import FaceTracker from "./components/FaceTracker";

type Tab = "code" | "whiteboard" | "notes";

export default function InterviewPage() {
  const navigate = useNavigate();
  const livekitToken = localStorage.getItem("owlyn_livekit_token");
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
      <InterviewInterface />
    </LiveKitRoom>
  );
}

function InterviewInterface() {
  const navigate = useNavigate();
  const whiteboardRef = useRef<{ getData: () => string | undefined }>(null);
  const { elapsedSeconds, tick } = useSessionStore();
  const { transcript, addTranscript, setCurrentQuestion } = useInterviewStore();
  const { stopAll } = useMediaStore();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const screenShareTrack = tracks.find((t) => t.participant.isLocal);

  // State
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState(
    "// Solution implementation\nfunction solve() {\n\n}",
  );
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // 13. Listen for AI Commands (LiveKit Data Channels)
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const msg = JSON.parse(decoder.decode(payload));

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
          // Shake screen effect could be triggered here via a class
          setTimeout(() => setProctorWarning(null), 5000);
        }

        if (msg.type === "TOOL_HIGHLIGHT") {
          console.log("Highlighting line:", msg.line);
          // Highlight logic...
        }
      } catch (err) {
        console.warn("Failed to parse data message");
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    if (room.state === "connected") setIsConnected(true);
    
    room.on(RoomEvent.Connected, () => setIsConnected(true));
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
        // 1. Screen Share @ 1FPS
        await localParticipant.setScreenShareEnabled(true, {
          contentHint: 'text',
        });
        
        // Note: LiveKit doesn't easily allow capping published FPS via setScreenShareEnabled options directly in all versions, 
        // but we set it up to signal the intent. The AI worker handles the actual sampling.
        
        // 2. Camera @ 1FPS (Proctoring)
        // We use setVideoEnabled with constraints if possible, or publish manually
        await localParticipant.setCameraEnabled(true);
        
      } catch (err) {
        console.warn("Failed to publish tracks:", err);
      }
    };

    if (isConnected) {
      startPublishing();
    }

    return () => {
      clearInterval(timer);
      stopAll();
    };
  }, [tick, stopAll, localParticipant, isConnected]);

  const handleEndSession = useCallback(() => {
    room?.disconnect();
    stopAll();
    candidateApi.releaseLockdown();
    navigate("/analysis");
  }, [navigate, stopAll, room]);

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

      <div className="flex-1 flex min-h-0 bg-[#0B0B0B]">
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
                  <CodeEditor value={code} onChange={setCode} />
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

        <div className="w-[420px] bg-[#0D0D0D] flex flex-col shrink-0 min-h-0">
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Display Share</span>
                <span className="text-primary/50 animate-pulse">Monitoring Active</span>
              </div>
              <div className="relative aspect-video rounded-sm overflow-hidden border border-white/5 bg-black shadow-2xl flex items-center justify-center">
                 {screenShareTrack ? (
                   <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-cover" />
                 ) : (
                   <span className="material-symbols-outlined text-4xl text-white/10">desktop_windows</span>
                 )}
                 <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Secure Stream</span>
                 </div>
              </div>
            </div>

            <FaceTracker
              onWarning={(msg) => {
                if (msg) {
                  setProctorWarning(msg);
                  setTimeout(() => setProctorWarning(null), 5000);
                }
              }}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>AI Agent</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6 flex items-center justify-center">
                <p className="text-[10px] text-slate-500 tracking-wide font-medium text-center">
                  LiveKit Engine Active
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 border-t border-white/5">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Transcript
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
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
