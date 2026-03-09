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
    "// Solution implementation\nfunction solve() {\n\n}",
  );
  const [isAITalking, setIsAITalking] = useState(false);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleEndSession = useCallback(() => {
    wsService.disconnect();
    audioPlaybackService.stop();
    stopAll();
    candidateApi.releaseLockdown();
    navigate("/analysis");
  }, [navigate, stopAll]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isWarning = elapsedSeconds >= 40 * 60 && elapsedSeconds < 44 * 60; // 5 min warning if duration is 45
  const isCritical = elapsedSeconds >= 44 * 60; // 1 min warning

  const handleRunReview = async () => {
    setLoading(true);
    wsService.sendRunCode();
    setTimeout(() => setLoading(false), 1500);
  };

  // Lifecycle
  useEffect(() => {
    const token = localStorage.getItem("owlyn_guest_token");
    const accessCode = localStorage.getItem("owlyn_access_code");
    const isPractice = localStorage.getItem("owlyn_practice_mode") === "true";

    if (!isPractice && (!token || !accessCode)) {
      navigate("/lobby");
      return;
    }

    const timer = setInterval(tick, 1000);

    let unsubConnect: (() => void) | undefined;
    let unsubDisconnect: (() => void) | undefined;
    let unsubMessage: (() => void) | undefined;
    let unsubBlur: (() => void) | undefined;

    async function startSession() {
      unsubConnect = wsService.onConnect(() => setIsConnected(true));
      unsubDisconnect = wsService.onDisconnect(() => setIsConnected(false));
      unsubMessage = wsService.onMessage((msg) => {
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

      unsubBlur = window.owlyn?.lockdown?.onBlur(() => {
        if (!isPractice) {
          setProctorWarning("Environment Breach: Window focus lost.");
          wsService.sendAlert(
            "ENVIRONMENT_BREACH",
            "Candidate navigated away from the application window.",
          );
        }
      });

      try {
        if (!isPractice) {
          await candidateApi.initiateLockdown(accessCode!, token!);
        }
      } catch (err) {
        console.warn("Lockdown init failed:", extractApiError(err));
      }

      try {
        const mode =
          localStorage.getItem("owlyn_interview_mode") || "INTERVIEW";
        if (mode === "TUTOR" && window.owlyn?.desktop) {
          const sources = await window.owlyn.desktop.getSources();
          const screenSource = sources.find((s) => s.id.startsWith("screen"));
          if (screenSource) {
            await useMediaStore.getState().startScreenShare(screenSource.id);
          } else if (sources.length > 0) {
            await useMediaStore.getState().startScreenShare(sources[0].id);
          } else {
            if (!cameraOn) await startCamera();
          }
        } else {
          if (!cameraOn) await startCamera();
        }

        if (!micOn) await startMic();
        wsService.connect(token || "PRACTICE");
      } catch (err) {
        console.error("Media/WSS connection error:", extractApiError(err));
      }
    }

    startSession();
    return () => {
      clearInterval(timer);
      unsubConnect?.();
      unsubDisconnect?.();
      unsubMessage?.();
      unsubBlur?.();
      wsService.disconnect();
      audioPlaybackService.stop();
    };
  }, []);

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
      const notes = localStorage.getItem("owlyn_notes") || "";
      wsService.sendMedia(base64, undefined, code, notes);
    };
    const interval = setInterval(sendFrame, 1000);
    return () => clearInterval(interval);
  }, [cameraOn, isConnected]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      if (cameraStream) videoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  return (
    <div className="h-screen w-full bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden">
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
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
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
            <span
              className={`text-[9px] uppercase font-black tracking-widest mb-1 ${isCritical ? "text-red-500 animate-pulse" : isWarning ? "text-[#c59f59]" : "text-primary"}`}
            >
              {isCritical ? "Critical" : isWarning ? "Remaining" : "Time"}
            </span>
            <span
              className={`text-xl font-mono ${isCritical ? "text-red-500" : isWarning ? "text-[#c59f59]" : "text-white"}`}
            >
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

            <div className="ml-auto">
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

        <div className="w-[420px] bg-[#0D0D0D] flex flex-col shrink-0 min-h-0">
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Webcam</span>
                <span className="text-green-500/50">Live</span>
              </div>
              <div className="relative aspect-video rounded-sm overflow-hidden border border-white/5 bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>AI Status</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6 flex items-center justify-center">
                <p className="text-[10px] text-slate-500 tracking-wide font-medium text-center">
                  {isAITalking
                    ? "Processing audio output..."
                    : "Awaiting input"}
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
