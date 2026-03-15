import { useState, useEffect, useRef } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track, createLocalScreenTracks, VideoPresets } from "livekit-client";
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
  const autoTriggeredRef = useRef(false);

  const hasPublishedScreenShareTrack = () => {
    if (!localParticipant) return false;
    const publications = Array.from(localParticipant.trackPublications.values());
    return publications.some(
      (publication) =>
        publication.source === Track.Source.ScreenShare &&
        !!publication.track,
    );
  };

  const waitForScreenSharePublication = async (timeoutMs = 15000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (hasPublishedScreenShareTrack()) return true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
  };

  const enableAssistantMedia = async () => {
    if (!localParticipant || room.state !== ConnectionState.Connected) return;
    setError(null);
    try {
      let sourceId: string | undefined;
      if (window.owlyn?.desktop?.getSources) {
        try {
          const sources = await window.owlyn.desktop.getSources();
          const screenSources = sources.filter((s: any) => 
            s.name?.toLowerCase().includes("screen") || 
            s.id?.toLowerCase().includes("screen")
          );
          sourceId = screenSources[0]?.id || sources[0]?.id;
          console.log("Assistant: Found Electron screen source:", sourceId);
        } catch (e) {
          console.warn("Assistant: Failed to get desktop sources:", e);
        }
      }

      if (sourceId) {
        const tracks = await createLocalScreenTracks({
          resolution: VideoPresets.h1080.resolution,
          contentHint: "text",
          // @ts-ignore
          deviceId: { exact: sourceId } 
        });
        if (tracks.length > 0) {
          await localParticipant.publishTrack(tracks[0]);
        }
      } else {
        await localParticipant.setScreenShareEnabled(true, { contentHint: "text" });
      }

      const published = await waitForScreenSharePublication();
      if (!published) {
        setError("Screen sharing is required. Please authorize screen sharing.");
        setIsSharingScreen(false);
        autoTriggeredRef.current = false; // Allow retry
        return;
      }
      setIsSharingScreen(true);
    } catch (err: any) {
      console.warn("Screen share access failed", err);
      setError("Screen sharing is required for assistant mode.");
      setIsSharingScreen(false);
      autoTriggeredRef.current = false; // Allow retry
      return;
    }

    try {
      await localParticipant.setMicrophoneEnabled(true);
      const encoder = new TextEncoder();
      localParticipant.publishData(
        encoder.encode(JSON.stringify({ event: "USER_JOINED" })), 
        { reliable: true }
      );
      console.log("Assistant: Re-signaled USER_JOINED after media enablement");
    } catch (err) {
      console.warn("Microphone access failed", err);
      setError("Microphone access is required for assistant mode.");
    }
  };

  // Auto-start media when everything is ready
  useEffect(() => {
    if (
      !localParticipant || 
      room.state !== ConnectionState.Connected || 
      autoTriggeredRef.current || 
      isEnding || 
      isSharingScreen
    ) return;

    console.log("Assistant: Auto-triggering media enablement...");
    autoTriggeredRef.current = true;
    enableAssistantMedia().catch(err => {
      console.error("Assistant: Auto-start failed", err);
      autoTriggeredRef.current = false;
    });
  }, [localParticipant, room.state, isEnding, isSharingScreen]);

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
        
        if (type === "AI_SPEAKING") {
          setAiSpeaking(msg.active);
        } else if (text) {
          addTranscript({
            id: msg.id || Date.now().toString(),
            timestamp: new Date().toISOString(),
            speaker: msg.speaker || "ai",
            text: text,
          });
          if (msg.speaker !== "candidate") setCurrentQuestion(text);
        }
      } catch (err) {
        console.warn("AI command error:", err);
      }
    };

    const handleTranscription = (transcription: any) => {
      transcription.segments.forEach((segment: any) => {
        if (segment.text.trim()) {
          const isLocal = transcription.participantIdentity === room.localParticipant?.identity;
          addTranscript({
            id: segment.id || `seg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            speaker: isLocal ? "candidate" : "ai",
            text: segment.text.trim(),
          });
          if (!isLocal) setCurrentQuestion(segment.text.trim());
        }
      });
    };

    const handleDisconnect = () => setIsConnected(false);
    const handleConnect = () => setIsConnected(true);

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.Connected, handleConnect);
    room.on(RoomEvent.Disconnected, handleDisconnect);

    if (room.state === ConnectionState.Connected) setIsConnected(true);

    // Track unpublication
    const handleTrackUnpublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        setIsSharingScreen(false);
        handleEnd();
      }
    };
    localParticipant?.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.Connected, handleConnect);
      room.off(RoomEvent.Disconnected, handleDisconnect);
      localParticipant?.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    };
  }, [room, localParticipant, addTranscript, setCurrentQuestion, setAiSpeaking]);

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
