import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { interviewsApi } from "@/api";
import { RoomEvent } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";
import { useMediaStore } from "@/stores/media.store";

export function useMonitoring() {
  const { interviewId } = useParams();
  const room = useRoomContext();
  const [interview, setInterview] = useState<any>(null);
  const [monitorToken, setMonitorToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

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
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Initialization failed");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [interviewId]);

  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        const type = data.type || data.event;
        if (["PROCTOR_WARNING", "PROCTOR_ACTIVITY", "WORKSPACE_ALERT"].includes(type)) {
          setAlerts(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), message: data.message || "Activity detected" }, ...prev.slice(0, 49)]);
        }
      } catch (err) {}
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.disconnect();
      useMediaStore.getState().stopAll();
    };
  }, [room]);

  return { interview, monitorToken, loading, error, alerts };
}
