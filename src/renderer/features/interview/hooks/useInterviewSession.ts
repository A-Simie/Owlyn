import { useState, useEffect, useRef } from "react";
import { ConnectionState, RoomEvent, Track} from "livekit-client";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { useInterviewStore } from "@/stores/interview.store";
import { useSessionStore } from "@/stores/session.store";

export type ActivityEvent = {
  id: string;
  source: "proctor" | "workspace" | "local";
  message: string;
  timestamp: string;
};

export function useInterviewSession(
  isCommenced: boolean, 
  isEnding: boolean,
  handleEndSession: (force?: boolean, reason?: string) => Promise<void>
) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { addTranscript, setCurrentQuestion, setAiSpeaking } = useInterviewStore();
  const [isConnected, setIsConnected] = useState(room.state === ConnectionState.Connected);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [localFaceWarning, setLocalFaceWarning] = useState<string | null>(null);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [showMediaRecovery, setShowMediaRecovery] = useState(false);
  const [recoveryType, setRecoveryType] = useState<"screen" | "camera" | "mic">("screen");
  const forcedEndHandledRef = useRef(false);

  const pushActivityEvent = (source: ActivityEvent["source"], message: string) => {
    const cleanMessage = (message || "").trim();
    if (!cleanMessage) return;

    setActivityEvents((current) => {
      const next: ActivityEvent[] = [
        {
          id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source,
          message: cleanMessage,
          timestamp: new Date().toISOString(),
        },
        ...current,
      ];
      return next.slice(0, 10);
    });
  };

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const raw = new TextDecoder().decode(payload);
        let msg: any;
        try {
          msg = JSON.parse(raw);
        } catch {
          if (raw.trim()) {
            addTranscript({
              id: `raw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              timestamp: new Date().toISOString(),
              speaker: "ai",
              text: raw.trim(),
            });
            setCurrentQuestion(raw.trim());
          }
          return;
        }

        const type = msg.type || msg.event;
        const text = msg.text || msg.content || msg.message || msg.transcript || msg.dialogue;

        if (text && (type === "transcript" || type === "text" || type === "speech" || type === "assistant_message" || !type)) {
          addTranscript({
            id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date().toISOString(),
            speaker: msg.speaker === "candidate" ? "candidate" : "ai",
            text: text,
          });
          if (msg.speaker !== "candidate") setCurrentQuestion(text);
          return;
        }

        switch (type) {
          case "PROCTOR_WARNING":
            setProctorWarning(msg.message);
            pushActivityEvent("proctor", msg.message || "Proctor warning detected");
            setTimeout(() => setProctorWarning(null), 5000);
            break;
          case "AI_SPEAKING":
            setAiSpeaking(msg.active);
            break;
          case "TOOL_HIGHLIGHT":
            setHighlightedLine(msg.line);
            setTimeout(() => setHighlightedLine(null), 3000);
            break;
          case "END_INTERVIEW":
            if (forcedEndHandledRef.current) break;
            forcedEndHandledRef.current = true;
            setProctorWarning(msg.message || "Interview terminated by interviewer.");
            setTimeout(() => handleEndSession(true), 300);
            break;
        }
      } catch (err) {
        console.warn("AI command error:", err);
      }
    };

    const handleTranscription = (transcription: any) => {
      if (!transcription?.segments) return;
      transcription.segments.forEach((segment: any) => {
        const text = segment.text?.trim();
        if (!text) return;
        const isLocal = transcription.participantIdentity === room?.localParticipant?.identity;
        const transcriptId = segment.id || `utm-${transcription.participantIdentity}-${Math.floor(segment.startTime / 100)}`;
        addTranscript({
          id: transcriptId,
          timestamp: new Date().toISOString(),
          speaker: isLocal ? "candidate" : "ai",
          text: text,
        });
        if (!isLocal) setCurrentQuestion(text);
      });
    };

    const handleTrackUnpublished = (publication: any) => {
      if (isEnding || forcedEndHandledRef.current) return;
      const source = publication.source || publication.track?.source;
      if (source === Track.Source.ScreenShare) { setRecoveryType("screen"); setShowMediaRecovery(true); }
      else if (source === Track.Source.Camera) { setRecoveryType("camera"); setShowMediaRecovery(true); }
      else if (source === Track.Source.Microphone) { setRecoveryType("mic"); setShowMediaRecovery(true); }
    };

    const handleTrackMuted = (publication: any) => {
       if (isEnding || forcedEndHandledRef.current) return;
       const source = publication.source || publication.track?.source;
       if (source === Track.Source.ScreenShare || source === Track.Source.Camera) {
          setRecoveryType(source === Track.Source.ScreenShare ? "screen" : "camera");
          setShowMediaRecovery(true);
       }
    };

    const handleTrackPublished = (publication: any) => {
      const source = publication.source || publication.track?.source;
      if (source === Track.Source.ScreenShare || source === Track.Source.Camera || source === Track.Source.Microphone) {
        setShowMediaRecovery(false);
      }
    };

    const handleTrackUnmuted = (publication: any) => {
      const source = publication.source || publication.track?.source;
      if (source === Track.Source.ScreenShare || source === Track.Source.Camera || source === Track.Source.Microphone) {
        setShowMediaRecovery(false);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
    room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    room.on(RoomEvent.TrackMuted, handleTrackMuted);
    
    // Listen to local participant for unmute/publish to clear recovery modal
    localParticipant?.on("trackPublished" as any, handleTrackPublished);
    localParticipant?.on("trackUnmuted" as any, () => setShowMediaRecovery(false));
    localParticipant?.on("localTrackPublished" as any, () => setShowMediaRecovery(false));

    const integrityInterval = setInterval(() => {
      if (!isCommenced || !localParticipant || isEnding || forcedEndHandledRef.current) return;
      
      const publications = Array.from(localParticipant.trackPublications.values());
      const screenPub = publications.find(p => p.source === Track.Source.ScreenShare);
      // More robust check: is it published AND not muted?
      const isSharing = !!screenPub && !screenPub.isMuted;

      const camPub = publications.find(p => p.source === Track.Source.Camera);
      const isCamActive = !!camPub && !camPub.isMuted;

      const micPub = publications.find(p => p.source === Track.Source.Microphone);
      const isMicActive = !!micPub && !micPub.isMuted;

      // If everything is healthy, ensure the modal is CLOSED
      if (isSharing && isCamActive && isMicActive) {
        setShowMediaRecovery(false);
        return;
      }

      // If screen share is lost, it's a critical recovery trigger
      if (!isSharing && !showMediaRecovery) {
        setRecoveryType("screen");
        setShowMediaRecovery(true);
      }
    }, 3000);

    const onConnected = () => setIsConnected(true);
    const onDisconnected = () => { 
      setIsConnected(false); 
      setShowMediaRecovery(false); 
    };
    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
      room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
      room.off(RoomEvent.TrackMuted, handleTrackMuted);
      room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
      room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
      clearInterval(integrityInterval);
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, isCommenced, isEnding, localParticipant, addTranscript, setCurrentQuestion, setAiSpeaking, handleEndSession, showMediaRecovery]);

  // Dedicated Timer Effect
  useEffect(() => {
    if (!isCommenced || isEnding || forcedEndHandledRef.current) return;
    
    const timerInterval = setInterval(() => {
      useSessionStore.getState().tick();
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [isCommenced, isEnding]);

  return {
    isConnected,
    proctorWarning,
    setProctorWarning,
    localFaceWarning,
    setLocalFaceWarning,
    activityEvents,
    pushActivityEvent,
    highlightedLine,
    showMediaRecovery,
    setShowMediaRecovery,
    recoveryType,
  };
}
