import { useState, useEffect } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import { useInterviewStore } from "@/stores/interview.store";
import { useCandidateStore } from "@/stores/candidate.store";
import { useMediaStore } from "@/stores/media.store";
import { useNavigate } from "react-router-dom";

export function useAssistantSession() {
  const navigate = useNavigate();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { 
    addTranscript, 
    setCurrentQuestion, 
    reset: resetInterview,
    setAiSpeaking 
  } = useInterviewStore();
  const { clearSession } = useCandidateStore();
  const { stopAll } = useMediaStore();

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const hasPublishedScreenShareTrack = () => {
    if (!localParticipant) return false;
    const publications = Array.from(localParticipant.trackPublications.values());
    return publications.some(
      (publication) =>
        publication.source === Track.Source.ScreenShare &&
        !!publication.track,
    );
  };

  const waitForScreenSharePublication = async (timeoutMs = 3500) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (hasPublishedScreenShareTrack()) return true;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return false;
  };

  const enableAssistantMedia = async () => {
    if (!localParticipant || room.state !== ConnectionState.Connected) return;
    setError(null);
    try {
      await localParticipant.setScreenShareEnabled(true, { contentHint: "text" });
      const published = await waitForScreenSharePublication();
      if (!published) {
        setError("Screen sharing is required. Please enable full screen sharing.");
        setIsSharingScreen(false);
        return;
      }
      setIsSharingScreen(true);
    } catch (err) {
      console.warn("Screen share access failed", err);
      setError("Screen sharing is required for assistant mode.");
      setIsSharingScreen(false);
      return;
    }

    try {
      await localParticipant.setMicrophoneEnabled(true);
    } catch (err) {
      console.warn("Microphone access failed", err);
      setError("Microphone access is required for assistant mode.");
    }
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
              id: `raw-${Date.now()}`,
              timestamp: new Date().toISOString(),
              speaker: "ai",
              text: raw.trim(),
            });
            setCurrentQuestion(raw.trim());
          }
          return;
        }

        const type = msg.type || msg.event;
        const text = msg.text || msg.content || msg.message || msg.transcript;

        switch (type) {
          case "transcript":
          case "text":
          case "speech":
          case "assistant_message":
            if (text) {
              addTranscript({
                id: msg.id || Date.now().toString(),
                timestamp: new Date().toISOString(),
                speaker: msg.speaker || "ai",
                text: text,
              });
              if (msg.speaker !== "candidate") setCurrentQuestion(text);
            }
            break;
          case "AI_SPEAKING":
            setAiSpeaking(msg.active);
            break;
        }
      } catch (err) {
        console.warn("AI command error:", err);
      }
    };

    const handleTranscription = (transcription: any) => {
      transcription.segments.forEach((segment: any) => {
        if (segment.text.trim()) {
          const isLocal = transcription.participantIdentity === room.localParticipant.identity;
          const text = segment.text.trim();
          addTranscript({
            id: segment.id || `seg-${transcription.participantIdentity}`,
            timestamp: new Date().toISOString(),
            speaker: isLocal ? "candidate" : "ai",
            text: text,
          });
          if (!isLocal) setCurrentQuestion(text);
        }
      });
    };

    const checkAndSignal = () => {
      if (room.state === ConnectionState.Connected) {
        const participant = room.localParticipant;
        const encoder = new TextEncoder();
        participant.publishData(
          encoder.encode(JSON.stringify({ event: "USER_JOINED" })), 
          { reliable: true }
        );
        setIsConnected(true);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.Connected, checkAndSignal);
    room.on(RoomEvent.Disconnected, () => setIsConnected(false));
    if (room.state === ConnectionState.Connected) checkAndSignal();

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.Connected, checkAndSignal);
    };
  }, [room, addTranscript, setCurrentQuestion, setAiSpeaking]);

  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);
    if (window.owlyn?.window?.setWidgetMode) {
      await window.owlyn.window.setWidgetMode(false);
    }
    await room?.disconnect();
    stopAll();
    resetInterview();
    clearSession();
    navigate("/auth?step=candidate-options");
  };

  return {
    isConnected,
    error,
    isSharingScreen,
    enableAssistantMedia,
    handleEnd,
    isEnding
  };
}
