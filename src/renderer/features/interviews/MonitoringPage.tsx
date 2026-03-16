import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { useMonitoring, useMonitoringEvents } from "./hooks/useMonitoring";
import { MonitoringHeader } from "./components/MonitoringHeader";
import { MonitoringLiveFeed } from "./components/MonitoringLiveFeed";
import { MonitoringSentinelAlerts } from "./components/MonitoringSentinelAlerts";

export default function MonitoringPage() {
  const navigate = useNavigate();
  const { interview, monitorToken, loading, error } = useMonitoring();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-primary text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Setting up monitoring dashboard...
        </div>
      </div>
    );
  }

  if (error || !monitorToken) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</div>
        <button onClick={() => navigate("/interviews")} className="px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-sm">Go Back</button>
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
      <RoomAudioRenderer />
      <MonitoringContent interview={interview} onExit={() => navigate("/interviews")} />
    </LiveKitRoom>
  );
}

function MonitoringContent({ interview, onExit }: { interview: any; onExit: () => void }) {
  const room = useRoomContext();
  const { alerts, sessionEnded, endReason, countdown } = useMonitoringEvents();
  const participantsCount = room?.remoteParticipants?.size ?? 0;

  // Auto-navigate when countdown reaches 0
  useEffect(() => {
    if (sessionEnded && countdown <= 0) {
      onExit();
    }
  }, [sessionEnded, countdown, onExit]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col h-screen overflow-hidden font-sans relative">
      <MonitoringHeader 
        interview={interview} 
        onExit={onExit} 
        participantCount={participantsCount} 
        trackCount={0}
      />

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          <MonitoringLiveFeed />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <MonitoringSentinelAlerts alerts={alerts} />
        </div>
      </main>

      {/* Session Ended Overlay */}
      {sessionEnded && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 max-w-lg text-center px-8">
            <div className="size-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-500">call_end</span>
            </div>

            <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white">
              Interview Ended
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              {endReason}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-lg font-black text-primary">{countdown}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Redirecting in {countdown}s...
              </span>
            </div>

            <button
              onClick={onExit}
              className="mt-4 px-8 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all"
            >
              Exit Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

