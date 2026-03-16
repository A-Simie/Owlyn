import { useMemo } from "react";
import { Track } from "livekit-client";
import { useLocalParticipant, useTracks } from "@livekit/components-react";
import { useCandidateStore } from "@/stores/candidate.store";
import FaceTracker from "./FaceTracker";
import AudioWaveform from "./AudioWaveform";
import TranscriptSidebar from "./TranscriptSidebar";

interface InterviewSidebarProps {
  isWidget: boolean;
  isEnding: boolean;
  isSpeaking: boolean;
  setLocalFaceWarning: (msg: string | null) => void;
  pushActivityEvent: (source: "proctor" | "workspace" | "local", msg: string) => void;
  onEndSession: (force?: boolean) => void;
  onToggleWidget: () => void;
}

export default function InterviewSidebar({
  isWidget,
  isEnding,
  isSpeaking,
  setLocalFaceWarning,
  pushActivityEvent,
  onEndSession,
  onToggleWidget,
}: InterviewSidebarProps) {
  const { isAssistantMode } = useCandidateStore();
  const { localParticipant } = useLocalParticipant();
  const cameraTracks = useTracks([Track.Source.Camera]).filter((t) => t.participant === localParticipant);
  const screenTracks = useTracks([Track.Source.ScreenShare]).filter((t) => t.participant === localParticipant);
  const isScreenSharing = screenTracks.length > 0;
  const localCameraTrack = cameraTracks[0];
  const localCameraStream = useMemo(() => {
    const track = localCameraTrack?.publication?.track;
    if (!track) return null;
    
    // Attempt to get MediaStream from LiveKit track
    if ((track as any).mediaStream instanceof MediaStream) {
      return (track as any).mediaStream;
    }
    
    // Fallback: Create new MediaStream from track's MediaStreamTrack
    if (track.mediaStreamTrack) {
      return new MediaStream([track.mediaStreamTrack]);
    }
    
    return null;
  }, [localCameraTrack]);

  return (
    <div
      className={`${isWidget ? "flex-1" : "w-[360px]"} bg-[#0D0D0D] flex flex-col shrink-0 min-h-0 overflow-y-auto custom-scrollbar border-l border-white/5 z-40`}
    >
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Candidate Feed
            </span>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black shadow-2xl">
            {!isEnding && (
              <FaceTracker 
                onWarning={(message) => {
                  setLocalFaceWarning(message);
                  if (message) {
                    pushActivityEvent("local", message);
                  }
                }} 
                stream={localCameraStream} 
              />
            )}
            
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 z-20">
              <div className={`size-1.5 rounded-full ${isScreenSharing ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[7px] font-black uppercase tracking-widest text-white/70">
                {isScreenSharing ? "Screen Active" : "Screen Off"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/[0.02] border border-primary/20 rounded-xl p-6 flex flex-col items-center gap-4">
            <AudioWaveform isActive={isSpeaking} color="#c59f59" />
            <div className="text-center">
              <p className={`text-[10px] text-primary font-black uppercase tracking-[0.4em] ${isSpeaking ? "animate-pulse" : ""}`}>
                {isSpeaking ? "Owlyn Speaking" : "Standby"}
              </p>
            </div>
          </div>
        </div>

        {!isWidget && (
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Live Transcript
            </span>
            <div className="h-[300px] border border-white/5 rounded-lg bg-black/20 overflow-hidden">
              <TranscriptSidebar />
            </div>
          </div>
        )}

        {isAssistantMode && isWidget && (
          <button
            onClick={() => onEndSession(true)}
            className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-900/20"
          >
            <span className="material-symbols-outlined text-sm">power_settings_new</span>
            End Assistant Mode
          </button>
        )}

        {isAssistantMode && !isWidget && (
          <button
            onClick={onToggleWidget}
            className="w-full py-3 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">pip</span>
            Toggle Widget
          </button>
        )}
      </div>
    </div>
  );
}
