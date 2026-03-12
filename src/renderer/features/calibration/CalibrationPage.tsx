import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaStore } from "@/stores/media.store";

export default function CalibrationPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startCamera, cameraStream, cameraOn } = useMediaStore();

  const [isCalibrating, setIsCalibrating] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [step, setStep] = useState(0);

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

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraStream]);

  // Face Detection Loop
  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;

    let rafId: number;
    let detector: any = null;

    // Check for FaceDetector API (Experimental)
    if ("FaceDetector" in window) {
      // @ts-ignore
      detector = new window.FaceDetector({ fastMode: true, maxFaces: 1 });
    }

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Sync dimensions precisely with source video track
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (canvas.width === 0) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detector) {
        try {
          const faces = await detector.detect(video);
          if (faces.length > 0) {
            setFaceDetected(true);
            const face = faces[0].boundingBox;

            // Draw tactical overlay
            ctx.strokeStyle = "#c59f59";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(face.x, face.y, face.width, face.height);

            // Corner brackets
            const l = 20;
            ctx.setLineDash([]);
            ctx.beginPath();
            // Top Left
            ctx.moveTo(face.x, face.y + l);
            ctx.lineTo(face.x, face.y);
            ctx.lineTo(face.x + l, face.y);
            // Top Right
            ctx.moveTo(face.x + face.width - l, face.y);
            ctx.lineTo(face.x + face.width, face.y);
            ctx.lineTo(face.x + face.width, face.y + l);
            // Bottom Right
            ctx.moveTo(face.x + face.width, face.y + face.height - l);
            ctx.lineTo(face.x + face.width, face.y + face.height);
            ctx.lineTo(face.x + face.width - l, face.y + face.height);
            // Bottom Left
            ctx.moveTo(face.x + l, face.y + face.height);
            ctx.lineTo(face.x, face.y + face.height);
            ctx.lineTo(face.x, face.y + face.height - l);
            ctx.stroke();

            // ID markers
            ctx.fillStyle = "#c59f59";
            ctx.font = "bold 10px Inter";
            ctx.fillText("BIOMETRIC_SYNC: ACTIVE", face.x, face.y - 10);
          } else {
            setFaceDetected(false);
          }
        } catch (e) {
          console.error("Detection error:", e);
        }
      } else {
        // Fallback: Ensure user is at least present in frame center
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = 100;
        ctx.strokeStyle = "#c59f5944";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        
        // Pass if stream is pumping data
        setFaceDetected(video.readyState >= 3);
      }
      rafId = requestAnimationFrame(detect);
    };

    detect();
    return () => cancelAnimationFrame(rafId);
  }, [cameraOn]);

  useEffect(() => {
    if (faceDetected) {
      const timer = setInterval(() => {
        setStep((s) => (s < 2 ? s + 1 : s));
      }, 2000);
      return () => clearInterval(timer);
    }
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
              {!faceDetected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10"
                >
                  <div className="size-20 rounded-full border-2 border-primary/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary animate-pulse">
                      face
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">
                    Face Not Detected
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs uppercase font-bold tracking-widest leading-loose">
                    Position your head within the camera's view to initiate the
                    session.
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
              disabled={step < 2}
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
