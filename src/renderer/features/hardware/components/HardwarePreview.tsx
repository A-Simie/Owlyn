import { RefObject, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HardwarePreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  cameraOn: boolean;
  micOn: boolean;
  cameraStream: MediaStream | null;
  audioLevel: number;
  faceDetected: boolean;
  isInitializingModels: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export function HardwarePreview({
  videoRef,
  cameraOn,
  micOn,
  cameraStream,
  audioLevel,
  faceDetected,
  isInitializingModels,
  onToggleCamera,
  onToggleMic,
}: HardwarePreviewProps) {
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      if (cameraStream) videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, videoRef]);

  return (
    <div className="flex-1 space-y-10">
      <div className="space-y-4">
        <h1 className="text-5xl font-black tracking-tight text-white leading-tight uppercase">
          System <span className="text-primary">Verification.</span>
        </h1>
        <p className="text-slate-500 text-lg font-light leading-relaxed max-w-xl">
          Verify your visual and audio inputs before entering the session.
        </p>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/5 shadow-2xl">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraOn ? "opacity-100" : "opacity-0"}`}
          muted
          playsInline
        />
        <AnimatePresence>
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-slate-600 bg-[#0A0A0A]">
              <div className="size-20 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-red-500/40">
                  videocam_off
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
                Camera Inactive
              </p>
            </div>
          )}
          {cameraOn && !isInitializingModels && !faceDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/40 backdrop-blur-md flex flex-col items-center justify-center text-center p-10"
            >
              <div className="size-16 rounded-full border-2 border-primary/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
                  face
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-1">
                Face Not Detected
              </h3>
              <p className="text-[10px] text-slate-300 max-w-xs uppercase font-bold tracking-widest leading-normal">
                Please position your face clearly in the frame.
              </p>
            </motion.div>
          )}
          {isInitializingModels && cameraOn && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Initializing Biometrics...
              </p>
            </div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-between pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button
              onClick={onToggleCamera}
              className={`size-14 rounded-sm flex items-center justify-center transition-all border ${cameraOn ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"}`}
            >
              <span className="material-symbols-outlined text-2xl">
                {cameraOn ? "videocam" : "videocam_off"}
              </span>
            </button>
            <button
              onClick={onToggleMic}
              className={`size-14 rounded-sm flex items-center justify-center transition-all border ${micOn ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"}`}
            >
              <span className="material-symbols-outlined text-2xl">
                {micOn ? "mic" : "mic_off"}
              </span>
            </button>
          </div>

          <div className="bg-black/40 backdrop-blur-xl p-6 rounded-sm border border-white/5 w-56 space-y-4 pointer-events-auto">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-primary">
              <span>Input Signal</span>
              <span>{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${Math.min(100, audioLevel * 200)}%` }}
                transition={{ type: "spring", damping: 15 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
