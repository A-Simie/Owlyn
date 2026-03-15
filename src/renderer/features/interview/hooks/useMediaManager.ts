import { useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";

export function useMediaManager() {
  const { localParticipant } = useLocalParticipant();
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isStartingMedia, setIsStartingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const hasPublishedScreenShareTrack = () => {
    if (!localParticipant) return false;
    const publications = Array.from(localParticipant.trackPublications.values());
    return publications.some(
      (publication) =>
        publication.source === Track.Source.ScreenShare &&
        !!publication.track,
    );
  };

  const waitForScreenSharePublication = async (timeoutMs = 30000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (hasPublishedScreenShareTrack()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return false;
  };

  const publishMedia = async (onSuccess?: () => void) => {
    if (!localParticipant || isStartingMedia) return;
    setIsStartingMedia(true);
    setMediaError(null);

    try {
      // 1. Microphone
      const micPublications = Array.from(localParticipant.trackPublications.values()).filter(p => p.source === Track.Source.Microphone);
      if (micPublications.length === 0 || !micPublications[0].track) {
        await localParticipant.setMicrophoneEnabled(true);
        // Sequential delay to prevent SDP BUNDLE collision
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. Camera
      const camPublications = Array.from(localParticipant.trackPublications.values()).filter(p => p.source === Track.Source.Camera);
      if (camPublications.length === 0 || !camPublications[0].track) {
        await localParticipant.setCameraEnabled(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // 3. Screen Share
      if (!hasPublishedScreenShareTrack()) {
        let sourceId: string | undefined;
        if (window.owlyn?.desktop?.getSources) {
          try {
            const sources = await window.owlyn.desktop.getSources();
            const screenSources = sources.filter((s: any) => s.name?.toLowerCase().includes("screen"));
            const source = screenSources[0] || sources[0];
            sourceId = source?.id;
          } catch (e) {
            console.warn("MediaManager: Failed to get desktop sources:", e);
          }
        }

        if (sourceId) {
          const screenStream = await (navigator.mediaDevices as any).getUserMedia({
            audio: false, // Explicitly disable screen audio to avoid opus collision
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: sourceId,
              },
            },
          });
          const screenTrack = screenStream.getVideoTracks()[0];
          await localParticipant.publishTrack(screenTrack, { 
            name: "screen_share", 
            source: Track.Source.ScreenShare 
          });
        } else {
          await localParticipant.setScreenShareEnabled(true, { 
            contentHint: "text",
            audio: false // CRITICAL fallback
          });
        }

        const screenShareEnabled = await waitForScreenSharePublication();
        if (!screenShareEnabled && !hasPublishedScreenShareTrack()) {
           setMediaError("Screen share authorization cancelled.");
           setIsStartingMedia(false);
           setIsMediaReady(false);
           return;
        }
      }

      setIsMediaReady(true);
      setIsStartingMedia(false);
      onSuccess?.();
    } catch (err) {
      console.error("Media publication failed:", err);
      setMediaError("Failed to authorize media devices.");
      setIsStartingMedia(false);
    }
  };

  return {
    isMediaReady,
    isStartingMedia,
    mediaError,
    publishMedia,
    setMediaError,
    setIsStartingMedia,
    setIsMediaReady,
  };
}
