import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { interviewsApi } from "@/api";
import { useAuthStore } from "@/stores/auth.store";

export default function MonitoringPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState<{
    videoFrame: string | null;
    codeEditorText: string;
    alertMessage: string | null;
  }>({
    videoFrame: null,
    codeEditorText: "",
    alertMessage: null,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [integrityScore, setIntegrityScore] = useState(100);

  useEffect(() => {
    async function fetchDetails() {
      if (!interviewId) return;
      try {
        const data = await interviewsApi.getInterview(interviewId);
        setInterview(data);
      } catch (err) {
        console.error("Failed to fetch interview details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [interviewId]);

  useEffect(() => {
    if (!token || !interviewId) return;

    const baseUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
    const wsUrl = `${baseUrl}/monitor?interviewId=${interviewId}&token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "MEDIA") {
          const payload = data.payload || data;
          setLiveData({
            videoFrame: payload.videoFrame,
            codeEditorText: payload.codeEditorText || "",
            alertMessage: payload.alertMessage,
          });

          if (data.integrityScore !== undefined) {
            setIntegrityScore(data.integrityScore);
          }

          if (payload.alertMessage) {
            addAlert(payload.alertMessage);
            if (data.integrityScore === undefined) {
              setIntegrityScore((prev) => Math.max(0, prev - 5));
            }
          }
        } else if (data.type === "ALERT") {
          addAlert(data.alertMessage);
          if (data.integrityScore !== undefined) {
            setIntegrityScore(data.integrityScore);
          } else {
            setIntegrityScore((prev) => Math.max(0, prev - 10));
          }
        }
      } catch (err) {
        console.error("Message parsing error:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, [interviewId, token]);

  const addAlert = (message: string) => {
    setAlerts((prev) => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        message,
      },
      ...prev.slice(0, 49),
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-primary text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Connecting to session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/interviews")}
            className="text-primary hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">
              Back
            </span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">
              Interview Monitor
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              Session: {interview?.title || "Active"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Candidate:{" "}
            </span>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {interview?.candidateName || "In Progress"}
            </span>
          </div>
          <button
            onClick={() => navigate("/interviews")}
            className="px-6 py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-all"
          >
            End Session
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-1 bg-black rounded-lg border border-white/5 relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
              Code Editor Content
            </div>

            <div className="flex-1 pt-12">
              <Editor
                height="100%"
                defaultLanguage="java"
                theme="vs-dark"
                value={liveData.codeEditorText}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  domReadOnly: true,
                }}
              />
            </div>

            <div className="absolute bottom-6 right-6 size-56 bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl z-20">
              {liveData.videoFrame ? (
                <img
                  src={
                    liveData.videoFrame.startsWith("data:")
                      ? liveData.videoFrame
                      : `data:image/jpeg;base64,${liveData.videoFrame}`
                  }
                  alt="Candidate webcam"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#111]">
                  <span className="material-symbols-outlined text-white/10">
                    videocam_off
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-white/20">
                    No video data
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold uppercase tracking-widest rounded-sm">
                Webcam
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          {/* Integrity Metrics Card */}
          <div className="bg-[#121212] border border-white/5 rounded-lg p-6 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Integrity Verification
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Confidence
                  </span>
                  <span
                    className={`text-xs font-black ${integrityScore < 70 ? "text-red-500" : "text-primary"}`}
                  >
                    {integrityScore}%
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: `${integrityScore}%` }}
                    className={`h-full ${integrityScore < 70 ? "bg-red-500" : "bg-primary"}`}
                  />
                </div>
              </div>

              <div className="space-y-2 border-l border-white/5 pl-4">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Alert Frequency
                  </span>
                  <span className="text-xs font-black text-white">
                    {(
                      alerts.filter((a) => Date.now() - a.id < 300000).length /
                      5
                    ).toFixed(1)}
                    Hz
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#121212] border border-white/5 rounded-lg flex flex-col overflow-hidden">
            <header className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Event Log
              </h3>
              {alerts.length > 0 && (
                <span className="size-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence initial={false}>
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <EventRow
                      key={alert.id}
                      time={alert.time}
                      text={alert.message}
                      isAlert={alert.message.includes("WARNING")}
                    />
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      No activity logged
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function EventRow({
  time,
  text,
  isAlert,
}: {
  time: string;
  text: string;
  isAlert: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      layout
      className={`p-3 border rounded-sm ${isAlert ? "border-red-500/20 bg-red-500/5 text-red-100" : "border-white/5 bg-white/[0.02] text-slate-400"}`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] font-black uppercase tracking-widest">
          {isAlert ? "Proctor Alert" : "Log"}
        </span>
        <span className="text-[8px] font-mono opacity-40">{time}</span>
      </div>
      <p className="text-[10px] font-normal leading-relaxed">{text}</p>
    </motion.div>
  );
}
