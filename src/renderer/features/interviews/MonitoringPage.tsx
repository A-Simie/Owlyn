import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { interviewsApi } from "@/api";
import { useAuthStore } from "@/stores/auth.store";

export default function MonitoringPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [monitorToken, setMonitorToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!interviewId) return;
      try {
        const [details, tokenData] = await Promise.all([
          interviewsApi.getInterview(interviewId),
          interviewsApi.getMonitorToken(interviewId),
        ]);
        setInterview(details);
        setMonitorToken(tokenData.livekitToken);
      } catch (err) {
        console.error("Monitoring init failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [interviewId]);

  if (loading || !monitorToken) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-primary text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Establishing Secure Handshake...
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      token={monitorToken}
      connect={true}
      audio={false}
      video={false}
    >
      <MonitoringInterface interview={interview} onExit={() => navigate("/interviews")} />
    </LiveKitRoom>
  );
}

function MonitoringInterface({ interview, onExit }: { interview: any; onExit: () => void }) {
  const room = useRoomContext();
  const [alerts, setAlerts] = useState<any[]>([]);

  const tracks = useTracks(
    [Track.Source.ScreenShare, Track.Source.Camera],
    { onlySubscribed: true }
  );

  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === "PROCTOR_WARNING") {
          addAlert(data.message);
        }
      } catch (err) {
        console.warn("Failed to parse monitoring data");
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

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

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onExit}
            className="text-primary hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Back</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">Live God-View</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              Watching: {interview?.candidateName || "Candidate"} · {interview?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-sm">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Stream Active</span>
          </div>
          <button
            onClick={onExit}
            className="px-6 py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 hover:text-white transition-all"
          >
            Stop Monitoring
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-1 bg-black rounded-lg border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
              Candidate Workspace (Screen Share)
            </div>
            
            {screenShareTrack ? (
              <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white/[0.02]">
                <div className="size-12 rounded-full border border-primary/20 border-t-primary animate-spin" />
                <p className="text-[10px] text-primary uppercase tracking-[0.2em]">Waiting for stream...</p>
              </div>
            )}

            <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20">

              {/* Webcam View */}
              <div className="size-56 bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl relative">
                {cameraTrack ? (
                  <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#111]">
                    <span className="material-symbols-outlined text-white/10">videocam_off</span>
                    <span className="text-[8px] uppercase tracking_widest text-white/20">No camera data</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold uppercase tracking-widest rounded-sm">
                  Webcam Feed
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">

          <div className="flex-1 bg-[#121212] border border-white/5 rounded-lg flex flex-col overflow-hidden">
            <header className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Sentinel Alerts</h3>
              {alerts.length > 0 && <span className="size-2 bg-red-500 rounded-full animate-bounce" />}
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence initial={false}>
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border border-red-500/20 bg-red-500/5 rounded-sm"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Security Alert</span>
                        <span className="text-[8px] font-mono opacity-40">{alert.time}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-300">{alert.message}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <span className="material-symbols-outlined text-4xl mb-2">shield_check</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest">No anomalies detected</p>
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

