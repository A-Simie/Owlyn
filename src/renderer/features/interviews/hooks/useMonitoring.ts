import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { interviewsApi } from "@/api";
import { RoomEvent } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";

export function useMonitoring() {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState<any>(null);
  const [monitorToken, setMonitorToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { interview, monitorToken, loading, error };
}

export function useMonitoringEvents() {
  const room = useRoomContext();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endReason, setEndReason] = useState<string>("");
  const [countdown, setCountdown] = useState(5);
  const endedRef = useRef(false);

  const triggerEnd = useCallback((reason: string) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSessionEnded(true);
    setEndReason(reason);
  }, []);

  // Countdown timer — starts when sessionEnded becomes true
  useEffect(() => {
    if (!sessionEnded) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEnded]);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        const type = data.type || data.event;

        if (["PROCTOR_WARNING", "PROCTOR_ACTIVITY", "WORKSPACE_ALERT"].includes(type)) {
          setAlerts(prev => [
            { 
              id: Date.now(), 
              time: new Date().toLocaleTimeString(), 
              message: data.message || "Activity detected" 
            }, 
            ...prev.slice(0, 49)
          ]);
        }

        if (type === "END_INTERVIEW") {
          triggerEnd(data.message || "The interview was terminated by the AI interviewer.");
        }
      } catch (err) {}
    };

    const handleParticipantDisconnected = (participant: any) => {
      // When the candidate or agent leaves, the interview is over
      triggerEnd(`Participant "${participant.identity}" has disconnected. The interview session has ended.`);
    };

    const handleRoomDisconnected = () => {
      triggerEnd("The interview room has been closed.");
    };
    
    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.Disconnected, handleRoomDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.Disconnected, handleRoomDisconnected);
    };
  }, [room, triggerEnd]);

  return { alerts, sessionEnded, endReason, countdown };
}
