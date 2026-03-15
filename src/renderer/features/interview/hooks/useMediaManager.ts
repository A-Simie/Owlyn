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
      if (!hasPublishedScreenShareTrack()) {
        const existingPub = Array.from(localParticipant.trackPublications.values()).find(p => p.source === Track.Source.ScreenShare);
        if (existingPub && existingPub.track) {
          try { await localParticipant.unpublishTrack(existingPub.track); } catch (e) {}
        }

        let sourceId: string | undefined;
        if (window.owlyn?.desktop?.getSources) {
          try {
            const sources = await window.owlyn.desktop.getSources();
            // PRIORITIZE "Screen" types for "Full Screen Sharing" as requested by proctor
            const fullScreens = sources.filter((s: any) => 
               s.name?.toLowerCase().includes("screen") || 
               s.name?.toLowerCase().includes("display") || 
               s.name?.toLowerCase().includes("desktop") ||
               s.id?.toLowerCase().startsWith("screen:") ||
               (s as any).type === "screen"
            );
            sourceId = fullScreens[0]?.id || sources.find((s: any) => s.id?.startsWith("screen:"))?.id || sources[0]?.id;
          } catch (e) { 
            console.warn("MediaManager: Desktop source fetch failed", e); 
          }
        }

        if (sourceId) {
          
           const screenStream = await (navigator.mediaDevices as any).getUserMedia({
             audio: false,
             video: {
               mandatory: {
                 chromeMediaSource: "desktop",
                 chromeMediaSourceId: sourceId,
                 maxWidth: 1920,
                 maxHeight: 1080,
                 maxFrameRate: 15 
               },
             },
           });
           const screenTrack = screenStream.getVideoTracks()[0];
           await localParticipant.publishTrack(screenTrack, { 
             source: Track.Source.ScreenShare,
             dtx: true,
             simulcast: false 
           });
        } else {
          await localParticipant.setScreenShareEnabled(true, { 
            contentHint: "text",
            audio: false 
          });
        }

        const screenShareEnabled = await waitForScreenSharePublication();
        if (!screenShareEnabled && !hasPublishedScreenShareTrack()) {
           setIsStartingMedia(false);
           return;
        }
      }

      setIsMediaReady(true);
      setIsStartingMedia(false);
      onSuccess?.();
    } catch (err) {
      console.error("Media publication failed:", err);
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
