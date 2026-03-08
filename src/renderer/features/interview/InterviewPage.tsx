import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionStore } from "@/stores/session.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useMediaStore } from "@/stores/media.store";
import { wsService } from "@/services/ws.service";
import { audioPlaybackService } from "@/services/playback.service";
import { candidateApi } from "@/api";
import { extractApiError } from "@/lib/api-error";

// Components
import CodeEditor from "./components/CodeEditor";
import Whiteboard from "./components/Whiteboard";
import Notes from "./components/Notes";

type Tab = "code" | "whiteboard" | "notes";

export default function InterviewPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { elapsedSeconds, tick } = useSessionStore();
  const { transcript, addTranscript, setCurrentQuestion } = useInterviewStore();
  const { cameraOn, micOn, cameraStream, startCamera, startMic, stopAll } =
    useMediaStore();

  // State
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState(
    "// Your solution here\nfunction solve() {\n\n}",
  );
  const [isAITalking, setIsAITalking] = useState(false);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleEndSession = useCallback(() => {
    wsService.disconnect();
    audioPlaybackService.stop();
    stopAll();
    navigate("/analysis");
  }, [navigate, stopAll]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleRunReview = async () => {
    setLoading(true);
    // Signal the environment to execute based on latest synchronization
    wsService.sendRunCode();

    setTimeout(() => setLoading(false), 1500);
  };
  // Lifecycle
  useEffect(() => {
    const token = localStorage.getItem("owlyn_guest_token");
    const accessCode = localStorage.getItem("owlyn_access_code");

    if (!token || !accessCode) {
      navigate("/lobby");
      return;
    }

    const timer = setInterval(tick, 1000);

    async function startSession() {
      try {
        // F3.4 — Lockdown Execution
        await candidateApi.initiateLockdown(accessCode!, token!);

        if (!cameraOn) await startCamera();
        if (!micOn) await startMic();

        wsService.onConnect(() => setIsConnected(true));
        wsService.onDisconnect(() => setIsConnected(false));
        wsService.onMessage((msg) => {
          if (msg.type === "transcript") {
            addTranscript({
              id: Date.now().toString(),
              timestamp: msg.timestamp,
              speaker: msg.speaker,
              text: msg.text,
            });
            if (msg.speaker === "ai") setCurrentQuestion(msg.text);
          }
          if (msg.type === "inlineData") {
            setIsAITalking(true);
            audioPlaybackService.playBase64Chunk(msg.data);
            setTimeout(() => setIsAITalking(false), 2000);
          }
          if (msg.type === "PROCTOR_WARNING") {
            setProctorWarning(msg.message);
            setTimeout(() => setProctorWarning(null), 5000);
          }
        });
        wsService.connect(token!);
      } catch (err) {
        console.error("Session start failed:", extractApiError(err));
      }
    }

    startSession();
    return () => {
      clearInterval(timer);
      wsService.disconnect();
      audioPlaybackService.stop();
    };
  }, []);

  // Media streaming (1fps webcam)
  useEffect(() => {
    if (!cameraOn || !isConnected) return;
    const sendFrame = () => {
      if (!videoRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const base64 = canvas.toDataURL("image/jpeg", 0.4).split(",")[1];
      wsService.sendMedia(base64);
    };
    const interval = setInterval(sendFrame, 1000);
    return () => clearInterval(interval);
  }, [cameraOn, isConnected]);

  // Sync video stream
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      if (cameraStream) videoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  return (
    <div className="h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Proctor Alert Banner */}
      <AnimatePresence>
        {proctorWarning && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="absolute top-0 left-0 w-full h-12 bg-red-600 text-white z-[100] flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.3em] shadow-2xl"
          >
            <span className="material-symbols-outlined">warning</span>
            {proctorWarning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-10 bg-[#0D0D0D] z-50">
        <div className="flex items-center gap-6">
          <div className="size-10 rounded-sm bg-[#c59f59]/10 border border-[#c59f59]/20 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[#c59f59] text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              owl
            </span>
          </div>
          <div className="h-8 w-px bg-white/5 mx-2" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em]">
              Evaluation Session
            </span>
            <span className="text-sm font-bold text-white tracking-widest uppercase italic">
              Owlyn Core v0.12.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-black text-[#c59f59] tracking-[0.4em] mb-1">
              Time Elapsed
            </span>
            <span className="text-xl font-mono text-white tracking-widest">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            className="px-8 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 active:scale-[0.98]"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 flex min-h-0 bg-[#0B0B0B]">
        {/* Main Content Area (Tabs) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          {/* Tab Navigation */}
          <div className="flex items-center px-6 gap-2 border-b border-white/5 h-14 bg-[#0D0DB]">
            <TabButton
              active={activeTab === "code"}
              onClick={() => setActiveTab("code")}
              label="Interactive Code"
              icon="code"
            />
            <TabButton
              active={activeTab === "whiteboard"}
              onClick={() => setActiveTab("whiteboard")}
              label="Multimodal Canvas"
              icon="draw"
            />
            <TabButton
              active={activeTab === "notes"}
              onClick={() => setActiveTab("notes")}
              label="Session Notes"
              icon="description"
            />

            <div className="ml-auto">
              <button
                onClick={handleRunReview}
                disabled={loading}
                className="flex items-center gap-3 px-6 py-2.5 bg-[#c59f59] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all aion-glow hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      play_arrow
                    </span>
                    Run & Review
                  </>
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
                  <Whiteboard />
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

        {/* Sidebar (Proctoring & Transcript) */}
        <div className="w-[420px] bg-[#0D0D0D] flex flex-col shrink-0 min-h-0">
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                <span>Optical Feed</span>
                <span className="text-green-500">Live</span>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                />
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-sm border border-white/10 flex items-center gap-2">
                  <div
                    className={`size-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`}
                  />
                  <span className="text-[8px] uppercase font-black text-white tracking-widest">
                    WSS Linked
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                <span>Interviewer Status</span>
                {isAITalking && (
                  <span className="text-[#c59f59] animate-pulse">Speaking</span>
                )}
              </div>
              <div className="surface-card border border-white/5 rounded-lg p-6 relative overflow-hidden group min-h-[100px] flex items-center justify-center">
                <div className="absolute left-0 top-0 w-1 h-full bg-[#c59f59]/30" />
                <p className="text-xs text-slate-400 leading-relaxed font-light italic text-center px-4">
                  {isAITalking ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      Evaluating response and processing multimodal input...
                    </motion.span>
                  ) : (
                    "Waiting for candidate interaction..."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Transcript Area */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Live Transcript
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">
                SHA-256 S-NODE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <span className="material-symbols-outlined text-4xl">
                    chat_bubble
                  </span>
                  <p className="text-[9px] uppercase tracking-widest font-black">
                    No signals captured
                  </p>
                </div>
              )}
              {transcript.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.speaker === "ai" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${msg.speaker === "ai" ? "items-start" : "items-end"} space-y-2`}
                >
                  <div
                    className={`flex items-center gap-2 ${msg.speaker === "ai" ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`size-1.5 rounded-full ${msg.speaker === "ai" ? "bg-[#c59f59]" : "bg-white/20"}`}
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {msg.speaker === "ai" ? "Owlyn" : "Candidate"}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] p-4 rounded-lg text-xs font-light leading-relaxed shadow-lg ${msg.speaker === "ai" ? "bg-white/[0.03] border border-white/5 text-slate-300" : "bg-[#c59f59]/10 border border-[#c59f59]/20 text-white"}`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
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
      className={`h-10 px-6 flex items-center gap-3 transition-all rounded-sm text-[10px] font-black uppercase tracking-[0.2em] border ${active ? "bg-[#c59f59]/10 border-[#c59f59]/40 text-[#c59f59]" : "bg-transparent border-transparent text-slate-600 hover:text-slate-400"}`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {label}
    </button>
  );
}
