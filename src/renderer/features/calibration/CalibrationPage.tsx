import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaStore } from "@/stores/media.store";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

const steps = [
  {
    title: "Enable Vision",
    desc: "Allow camera access to begin identity sync.",
  },
  {
    title: "Position Frame",
    desc: "Ensure your face is centered within the focus ring.",
  },
  {
    title: "Environmental Check",
    desc: "Optimal lighting detected for biometric monitoring.",
  },
];

export default function CalibrationPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startCamera, cameraStream, cameraOn } = useMediaStore();

  const [faceDetected, setFaceDetected] = useState(false);
  const [step, setStep] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (!cancelled) {
          setModelsLoaded(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        // Fallback or retry?
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraStream]);

  // Face Detection Loop
  useEffect(() => {
    if (!cameraOn || !videoRef.current || !modelsLoaded) return;

    let rafId: number;
    let running = true;

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.35, // Permissive for calibration
    });

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !running) return;

      // Wait for video to be ready
      if (video.readyState < 2 || video.videoWidth === 0) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks();

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const frameW = canvas.width * 0.4;
      const frameH = canvas.height * 0.5;
      const x = cx - frameW / 2;
      const y = cy - frameH / 2;

      if (detections.length > 0) {
        setFaceDetected(true);
        const detection = detections[0];
        const { box } = detection.detection;
        const landmarks = detection.landmarks;

        ctx.strokeStyle = "#c59f59";
        ctx.setLineDash([10, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.setLineDash([]);

        // Draw Landmarks
        ctx.fillStyle = "rgba(197, 159, 89, 0.8)";
        landmarks.positions.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        setFaceDetected(false);
      }

      rafId = requestAnimationFrame(detect);
    };

    detect();
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [cameraOn, modelsLoaded]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (faceDetected) {
      interval = setInterval(() => {
        setStep((s) => (s < 2 ? s + 1 : s));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [faceDetected]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(197,159,89,0.05),transparent_60%)] pointer-events-none" />

      <main className="w-full max-w-4xl z-10 space-y-12">
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] uppercase font-black tracking-widest text-primary mb-4"
          >
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Security Protocol Layer
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
            Biometric <span className="text-primary">Calibration.</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 bg-black shadow-2xl group">
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]"
            />

            <AnimatePresence>
              {isInitializing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-10 z-[50]"
                >
                  <div className="size-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em]">
                    Initializing Engine...
                  </h3>
                </motion.div>
              )}

              {!isInitializing && !faceDetected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-red-950/40 backdrop-blur-md flex flex-col items-center justify-center text-center p-10"
                >
                  <div className="size-20 rounded-full border-2 border-primary/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary animate-pulse">
                      face
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">
                    Face Not Detected
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs uppercase font-bold tracking-widest leading-loose">
                    Position your head within the camera's view to initiate the session.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                <div
                  className={`size-1.5 rounded-full ${faceDetected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                <span className="text-[8px] font-black uppercase text-white tracking-widest">
                  {faceDetected ? "LOCKED" : "SCANNING"}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: i <= step ? 1 : 0.2,
                    x: 0,
                    scale: i === step ? 1.02 : 1,
                  }}
                  className={`p-6 rounded-2xl border transition-all ${i === step ? "bg-primary/5 border-primary/40 shadow-xl shadow-primary/5" : "bg-white/[0.02] border-white/5"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center text-[10px] font-black ${i < step ? "bg-green-500 text-black" : i === step ? "bg-primary text-black" : "bg-white/5 text-slate-500"}`}
                    >
                      {i < step ? (
                        <span className="material-symbols-outlined text-sm">
                          check
                        </span>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-black uppercase tracking-widest ${i <= step ? "text-white" : "text-slate-600"}`}
                      >
                        {s.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-1">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => navigate("/hardware")}
              disabled={step < 2 || !faceDetected}
              className="w-full py-5 bg-primary text-black font-black uppercase tracking-[0.4em] text-xs rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl shadow-primary/20"
            >
              Continue to Diagnostic
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
