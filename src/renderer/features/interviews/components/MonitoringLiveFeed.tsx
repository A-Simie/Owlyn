import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";

export function MonitoringLiveFeed() {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.ScreenShare, Track.Source.Camera, Track.Source.Unknown]);
  
  const remoteTracks = tracks.filter((t) => !room.localParticipant?.identity || t.participant.identity !== room.localParticipant.identity);

  const isVideo = (tr: any) => {
    const pubkind = tr?.publication?.kind;
    const medkind = tr?.track?.mediaStreamTrack?.kind;
    return (pubkind === Track.Kind.Video || medkind === "video");
  };

  const getSource = (tr: any) => tr?.publication?.source ?? tr?.source;

  const screenShareTrack = remoteTracks.find(t => isVideo(t) && getSource(t) === Track.Source.ScreenShare) 
    ?? remoteTracks.find(t => isVideo(t) && getSource(t) !== Track.Source.Camera);

  const cameraTrack = remoteTracks.find(t => isVideo(t) && getSource(t) === Track.Source.Camera)
    ?? remoteTracks.find(t => isVideo(t) && t !== screenShareTrack);

  return (
    <div className="flex-1 bg-black rounded-lg border border-white/5 relative overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
        Candidate Workspace (Screen Share)
      </div>
      
      {screenShareTrack ? (
        <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white/[0.02]">
          <div className="size-12 rounded-full border border-primary/20 border-t-primary animate-spin" />
          <p className="text-[10px] text-primary uppercase tracking-[0.2em]">Waiting for stream...</p>
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-20">
        <div className="size-56 bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl relative">
          {cameraTrack ? (
            <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#111]">
              <span className="material-symbols-outlined text-white/10">videocam_off</span>
              <span className="text-[8px] uppercase tracking_widest text-white/20">No camera data</span>
            </div>
          )}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold uppercase tracking-widest rounded-sm">Webcam Feed</div>
        </div>
      </div>
    </div>
  );
}
