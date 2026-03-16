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
      // 1. Microphone - Only enable if not already published
      const micPub = Array.from(localParticipant.trackPublications.values()).find(p => p.source === Track.Source.Microphone);
      if (!micPub || !micPub.track) {
        await localParticipant.setMicrophoneEnabled(true);
      } else if (micPub.isMuted) {
        await micPub.track.unmute();
      }

      // 2. Camera - Only enable if not already published
      const camPub = Array.from(localParticipant.trackPublications.values()).find(p => p.source === Track.Source.Camera);
      if (!camPub || !camPub.track) {
        await localParticipant.setCameraEnabled(true);
      } else if (camPub.isMuted) {
        await camPub.track.unmute();
      }
      
      // 3. Screen Share
      console.log("MediaManager: Initiating hard screen share publication...");
      
      let sourceId: string | undefined;
      if (window.owlyn?.desktop?.getSources) {
        try {
          const sources = await window.owlyn.desktop.getSources();
          // Find the primary screen
          const screen = sources.find(s => s.id.toLowerCase().startsWith("screen:0")) || 
                        sources.find(s => s.id.toLowerCase().startsWith("screen:")) || 
                        sources[0];
          sourceId = screen?.id;
        } catch (e) {
          console.warn("MediaManager: Source fetch failed", e);
        }
      }

      if (sourceId) {
        const stream = await (navigator.mediaDevices as any).getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
              maxFrameRate: 15
            }
          }
        });
        
        const track = stream.getVideoTracks()[0];
        if (track) {
          track.contentHint = "text";
          await localParticipant.publishTrack(track, {
            source: Track.Source.ScreenShare,
            name: "screen_share", // Standard name for AI recognition
            simulcast: false
          });
        }
      } else {
        // Ultimate fallback
        await localParticipant.setScreenShareEnabled(true, { audio: false, contentHint: "text" });
      }

      const published = await waitForScreenSharePublication();
      if (!published) {
        setIsStartingMedia(false);
        setMediaError("Screen share failed to publish. Check system permissions.");
        return;
      }

      setIsMediaReady(true);
      setIsStartingMedia(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Media publication failed:", err);
      setIsStartingMedia(false);
      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
        setMediaError("Permission Denied: You must grant screen sharing access to proceed.");
      } else {
        setMediaError(`Media Error: ${err.message || "Failed to start media streams."}`);
      }
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
