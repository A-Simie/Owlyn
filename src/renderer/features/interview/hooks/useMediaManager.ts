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
    const pub = publications.find(
      (publication) =>
        publication.source === Track.Source.ScreenShare &&
        !!publication.track,
    );
    return !!pub && !pub.isMuted;
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
      const isMicPublished = Array.from(localParticipant.trackPublications.values()).some(p => p.source === Track.Source.Microphone && !!p.track);
      if (!isMicPublished) {
        await localParticipant.setMicrophoneEnabled(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. Camera
      const isCamPublished = Array.from(localParticipant.trackPublications.values()).some(p => p.source === Track.Source.Camera && !!p.track);
      if (!isCamPublished) {
        await localParticipant.setCameraEnabled(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 3. Screen Share
      if (!hasPublishedScreenShareTrack()) {
        // Force cleanup of any existing but muted/broken screen track
        const publications = Array.from(localParticipant.trackPublications.values());
        const existingPub = publications.find(p => p.source === Track.Source.ScreenShare);
        if (existingPub && existingPub.track) {
          try {
            await localParticipant.unpublishTrack(existingPub.track);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            console.warn("MediaManager: Failed to unpublish existing screen share:", e);
          }
        }

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
