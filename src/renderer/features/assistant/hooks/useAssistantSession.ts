import { useState, useEffect, useRef, useCallback } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track, createLocalScreenTracks, VideoPresets, type ScreenShareCaptureOptions } from "livekit-client";
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
  const mediaRequestPendingRef = useRef(false);
  const signaledJoinedRef = useRef<string | null>(null);

  const hasPublishedScreenShareTrack = useCallback(() => {
    if (!localParticipant) return false;
    const publications = Array.from(localParticipant.trackPublications.values());
    return publications.some(
      (publication) =>
        publication.source === Track.Source.ScreenShare &&
        !!publication.track,
    );
  }, [localParticipant]);

  const signalUserJoined = useCallback(() => {
    // Only signal if connected and not signaled for this SID
    const sessionToken = room.localParticipant?.sid || (room as any).sid || room.name;
    if (!sessionToken || signaledJoinedRef.current === sessionToken || !localParticipant || room.state !== ConnectionState.Connected) return;
    
    try {
      const encoder = new TextEncoder();
      localParticipant.publishData(
        encoder.encode(JSON.stringify({ event: "USER_JOINED" })), 
        { reliable: true }
      );
      signaledJoinedRef.current = sessionToken;
      console.log("Assistant: Signaled USER_JOINED for session", sessionToken);
    } catch (err) {
      console.warn("Assistant: Failed to signal USER_JOINED", err);
    }
  }, [room, localParticipant]);

  const waitForScreenSharePublication = async (timeoutMs = 15000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (hasPublishedScreenShareTrack()) return true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
  };

  const enableAssistantMedia = useCallback(async () => {
    if (mediaRequestPendingRef.current || !localParticipant || room.state !== ConnectionState.Connected) return;
    
    mediaRequestPendingRef.current = true;
    setError(null);

    try {
      // 1. Handle Microphone first (standard API)
      const micPublications = Array.from(localParticipant.trackPublications.values()).filter(p => p.source === Track.Source.Microphone);
      if (micPublications.length === 0 || !micPublications[0].track) {
        await localParticipant.setMicrophoneEnabled(true);
      }

      // 2. Handle Screen Share
      if (!hasPublishedScreenShareTrack()) {
        let sourceId: string | undefined;
        if (window.owlyn?.desktop?.getSources) {
          try {
            const sources = await window.owlyn.desktop.getSources();
            const screenSources = sources.filter((s: any) => 
              s.name?.toLowerCase().includes("screen") || 
              s.id?.toLowerCase().includes("screen")
            );
            sourceId = screenSources[0]?.id || sources[0]?.id;
          } catch (e) {
            console.warn("Assistant: Failed to get desktop sources:", e);
          }
        }

        const screenTrackOptions: ScreenShareCaptureOptions = {
          resolution: VideoPresets.h1080.resolution,
          contentHint: "text",
          ...(sourceId ? { deviceId: { exact: sourceId } as any } : {})
        };

        if (sourceId) {
          const tracks = await createLocalScreenTracks(screenTrackOptions);
          if (tracks.length > 0) {
            await localParticipant.publishTrack(tracks[0]);
          }
        } else {
          await localParticipant.setScreenShareEnabled(true, { contentHint: "text" });
        }

        const published = await waitForScreenSharePublication();
        if (!published) {
          if (!hasPublishedScreenShareTrack()) {
            setError("Screen sharing is required. Please authorize screen sharing.");
          }
          mediaRequestPendingRef.current = false;
          return;
        }
      }

      setIsSharingScreen(true);
      signalUserJoined();
    } catch (err: any) {
      console.warn("Media access failed", err);
      // Only set UI error if we definitely don't have a track and aren't ending
      if (!isEnding && !hasPublishedScreenShareTrack()) {
        setError("Camera and Microphone access are required for assistant mode.");
      }
    } finally {
      mediaRequestPendingRef.current = false;
    }
  }, [localParticipant, room.state, hasPublishedScreenShareTrack, signalUserJoined]);

  // Sync state on mounting or track changes
  useEffect(() => {
    const isSharing = hasPublishedScreenShareTrack();
    setIsSharingScreen(isSharing);
  }, [localParticipant, hasPublishedScreenShareTrack]);

  // Auto-start media when everything is ready
  useEffect(() => {
    if (
      !localParticipant || 
      room.state !== ConnectionState.Connected || 
      autoTriggeredRef.current || 
      isEnding
    ) return;

    if (hasPublishedScreenShareTrack()) {
        signalUserJoined();
        return;
    }

    console.log("Assistant: Auto-triggering media enablement...");
    autoTriggeredRef.current = true;
    enableAssistantMedia();
  }, [localParticipant, room.state, isEnding, hasPublishedScreenShareTrack, enableAssistantMedia, signalUserJoined]);

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
      if (!transcription?.segments) return;
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

    const handleDisconnect = () => {
      setIsConnected(false);
      signaledJoinedRef.current = null;
    };
    const handleConnect = () => setIsConnected(true);

    const handleTrackPublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        setIsSharingScreen(true);
        signalUserJoined();
      }
    };

    const handleTrackUnpublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        setIsSharingScreen(false);
        if (!isEnding) handleEnd();
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.Connected, handleConnect);
    room.on(RoomEvent.Disconnected, handleDisconnect);
    
    localParticipant?.on(RoomEvent.LocalTrackPublished, handleTrackPublished);
    localParticipant?.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);

    if (room.state === ConnectionState.Connected) setIsConnected(true);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
      room.off(RoomEvent.Connected, handleConnect);
      room.off(RoomEvent.Disconnected, handleDisconnect);
      localParticipant?.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
      localParticipant?.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    };
  }, [room, localParticipant, addTranscript, setCurrentQuestion, setAiSpeaking, isEnding, signalUserJoined]);

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
