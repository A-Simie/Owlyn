import { useNavigate } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { useMonitoring } from "./hooks/useMonitoring";
import { MonitoringHeader } from "./components/MonitoringHeader";
import { MonitoringLiveFeed } from "./components/MonitoringLiveFeed";
import { MonitoringSentinelAlerts } from "./components/MonitoringSentinelAlerts";

export default function MonitoringPage() {
  const navigate = useNavigate();
  const { interview, monitorToken, loading, error, alerts } = useMonitoring();

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
      <MonitoringContent interview={interview} alerts={alerts} onExit={() => navigate("/interviews")} />
    </LiveKitRoom>
  );
}

function MonitoringContent({ interview, alerts, onExit }: { interview: any; alerts: any[]; onExit: () => void }) {
  const room = useRoomContext();
  const participantsCount = room?.remoteParticipants?.size ?? 0;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col h-screen overflow-hidden font-sans">
      <MonitoringHeader 
        interview={interview} 
        onExit={onExit} 
        participantCount={participantsCount} 
        trackCount={0} // Room provides track info inside components
      />

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          <MonitoringLiveFeed />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <MonitoringSentinelAlerts alerts={alerts} />
        </div>
      </main>
    </div>
  );
}
