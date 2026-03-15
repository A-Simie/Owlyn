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
      let sourceId: string | undefined;
      // In Electron, we can pre-select the screen to avoid the picker
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
      
      // Signal again after media is enabled to ensure the agent knows we are ready
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

  useEffect(() => {
    if (!room) return;

    const autoStartMedia = async () => {
      if (autoTriggeredRef.current || isEnding || isSharingScreen) return;
      autoTriggeredRef.current = true;
      await enableAssistantMedia();
    };

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
        
        console.log("Assistant: Data message received", type, !!text);

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
          default:
            console.log("Assistant: Unhandled message type", msg);
        }
      } catch (err) {
        console.warn("AI command error:", err);
      }
    };

    const handleTranscription = (transcription: any) => {
      console.log("Assistant: Transcription received", transcription.participantIdentity);
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
      console.log("Assistant: Room state is", room.state);
      if (room.state === ConnectionState.Connected) {
        setIsConnected(true);
        console.log("Assistant: Connected to room, waiting for media to signal USER_JOINED");
        void autoStartMedia();
      }
    };

    const handleParticipantJoined = (p: any) => {
      console.log("Assistant: Participant joined", p.identity, p.metadata);
    };

    const handleParticipantDisconnected = (p: any) => {
      console.log("Assistant: Participant disconnected", p.identity);
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.Connected, checkAndSignal);
    room.on(RoomEvent.Disconnected, () => setIsConnected(false));
    room.on(RoomEvent.ParticipantConnected, handleParticipantJoined);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    // Monitor local tracks to detect when screen share stops
    const handleTrackUnpublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        console.log("Assistant: Screen share unpublished, ending session...");
        setIsSharingScreen(false);
        handleEnd();
      }
    };
    localParticipant?.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);

    if (room.state === ConnectionState.Connected) {
      checkAndSignal();
      void autoStartMedia();
    }

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.Connected, checkAndSignal);
      room.off(RoomEvent.ParticipantConnected, handleParticipantJoined);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      localParticipant?.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    };
  }, [room, localParticipant, addTranscript, setCurrentQuestion, setAiSpeaking, isEnding, isSharingScreen]);

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
