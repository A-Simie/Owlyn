import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaStore } from "@/stores/media.store";
import { candidateApi } from "@/api/candidate.api";
import { apiClient } from "@/lib/api-client";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

export default function HardwarePage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    cameraOn,
    micOn,
    cameraStream,
    audioLevel,
    startCamera,
    stopCamera,
    startMic,
    stopMic,
    setDisplayCount,
  } = useMediaStore();

  const [checks, setChecks] = useState({
    camera: false,
    mic: false,
    network: false,
    singleDisplay: true,
  });

  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isInitializingModels, setIsInitializingModels] = useState(true);

  // Display Check
  useEffect(() => {
    const checkDisplays = async () => {
      if (window.owlyn?.platform?.getDisplayCount) {
        try {
          const count = await window.owlyn.platform.getDisplayCount();
          setDisplayCount(count);
          setChecks(prev => ({ ...prev, singleDisplay: count === 1 }));
        } catch (e) {
          console.warn("Display check failed", e);
        }
      }
    };
    checkDisplays();
    const interval = setInterval(checkDisplays, 3000);
    return () => clearInterval(interval);
  }, [setDisplayCount]);

  useEffect(() => {
    if (!cameraOn) startCamera();
    if (!micOn) startMic();

    let cancelled = false;
    (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (!cancelled) {
          setModelsLoaded(true);
          setIsInitializingModels(false);
        }
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      if (cameraStream) videoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  useEffect(() => {
    const videoActive = cameraOn && !!cameraStream && videoRef.current?.videoWidth !== 0;
    const micActive = micOn;
    setChecks((prev) => ({ 
      ...prev, 
      camera: videoActive, 
      mic: micActive,
    }));
  }, [cameraOn, micOn, cameraStream, audioLevel]);

  // Face Detection Loop
  useEffect(() => {
    if (!cameraOn || !videoRef.current || !modelsLoaded) return;

    let rafId: number;
    let running = true;

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.35,
    });

    const detect = async () => {
      const video = videoRef.current;
      if (!video || !running) return;

      if (video.readyState < 2 || video.videoWidth === 0) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      const detections = await faceapi.detectAllFaces(video, options);
      setFaceDetected(detections.length > 0);

      rafId = requestAnimationFrame(detect);
    };

    detect();
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [cameraOn, modelsLoaded]);


  const runNetworkTest = useCallback(async () => {
    setIsChecking(true);
    let start = performance.now();
    try {
      try {
        await candidateApi.healthCheck();
      } catch (e) {
        await apiClient.get("/health");
      }
      const latency = Math.round(performance.now() - start);
      setNetworkLatency(latency);
      setChecks((prev) => ({ ...prev, network: latency < 5000 }));
    } catch (err) {
      console.error("Network check failed:", err);
      setNetworkLatency(null);
      setChecks((prev) => ({ ...prev, network: false }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    runNetworkTest();
  }, [runNetworkTest]);

  const canProceed = checks.camera && checks.mic && checks.network && faceDetected && checks.singleDisplay;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden">
      <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 bg-[#0D0D0D] z-20">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              owl
            </span>
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-white">
            Owlyn
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-12 lg:p-20 gap-16 max-w-7xl mx-auto w-full relative z-10">
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
                  onClick={() => (cameraOn ? stopCamera() : startCamera())}
                  className={`size-14 rounded-sm flex items-center justify-center transition-all border ${cameraOn ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"}`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {cameraOn ? "videocam" : "videocam_off"}
                  </span>
                </button>
                <button
                  onClick={() => (micOn ? stopMic() : startMic())}
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

        <div className="w-full lg:w-[480px] flex flex-col gap-8">
            <div className="bg-[#111] border border-white/5 rounded-sm p-10 flex-1 space-y-12">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  System Diagnostics
                </h3>
                <div className="flex items-center gap-2">
                   <button
                    onClick={runNetworkTest}
                    disabled={isChecking}
                    className="size-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-95 disabled:opacity-20"
                  >
                    <span className={`material-symbols-outlined text-sm ${isChecking ? "animate-spin" : ""}`}>
                      refresh
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <CheckItem
                  label="Webcam"
                  status={checks.camera}
                  desc={checks.camera ? "Operational" : "Check permissions"}
                  icon="videocam"
                />
                <CheckItem
                  label="Audio"
                  status={checks.mic}
                  desc={checks.mic ? "Operational" : "Check permissions"}
                  icon="keyboard_voice"
                />
                {!checks.singleDisplay && (
                   <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-4">
                      <span className="material-symbols-outlined text-red-500">monitor</span>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Multiple Monitors Detected</p>
                        <p className="text-[8px] text-red-400/80 uppercase mt-1">Please disconnect extra displays to proceed.</p>
                      </div>
                   </div>
                )}
                <CheckItem
                  label="Network"
                  status={checks.network}
                  desc={
                    isChecking
                      ? "Pinging..."
                      : checks.network
                        ? `${networkLatency}ms latency`
                        : "Network error"
                  }
                  icon="language"
                  loading={isChecking}
                />
              </div>
            </div>

            <div className="pt-10 border-t border-white/5">
              <button
                disabled={!canProceed}
                onClick={() => navigate("/lobby")}
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.4em] text-xs rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 transition-all"
              >
                {canProceed ? "Continue to Lobby" : (
                  !checks.singleDisplay ? "Disconnect Monitors" : "Check Diagnostics"
                )}
              </button>
            </div>
        </div>
      </main>
    </div>
  );
}

function CheckItem({
  label,
  status,
  desc,
  icon,
  loading,
}: {
  label: string;
  status: boolean;
  desc: string;
  icon: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-sm">
      <div className="flex items-center gap-5">
        <div
          className={`size-12 rounded-sm flex items-center justify-center border transition-all ${status ? "bg-primary/10 border-primary/30 text-primary" : loading ? "bg-white/5 border-white/10 text-slate-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
        >
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-widest">
            {label}
          </p>
          <p className="text-[10px] font-normal text-slate-500 tracking-wide uppercase">
            {desc}
          </p>
        </div>
      </div>
      {status && (
        <span className="material-symbols-outlined text-green-500 text-xl">
          check
        </span>
      )}
    </div>
  );
}
