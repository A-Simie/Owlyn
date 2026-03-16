import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

interface CalibrationCameraProps {
  cameraStream: MediaStream | null;
  cameraOn: boolean;
  onFaceStatusChange: (detected: boolean) => void;
}

export function CalibrationCamera({ cameraStream, cameraOn, onFaceStatusChange }: CalibrationCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);

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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!cameraOn || !videoRef.current || !modelsLoaded) return;

    let rafId: number;
    let running = true;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 });

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !running) return;

      if (video.readyState < 2 || video.videoWidth === 0) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      const detections = await faceapi.detectAllFaces(video, options).withFaceLandmarks();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        setFaceDetected(true);
        onFaceStatusChange(true);
        const detection = detections[0];
        const { box } = detection.detection;
        ctx.strokeStyle = "#c59f59";
        ctx.setLineDash([10, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(197, 159, 89, 0.8)";
        detection.landmarks.positions.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        setFaceDetected(false);
        onFaceStatusChange(false);
      }
      rafId = requestAnimationFrame(detect);
    };

    detect();
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [cameraOn, modelsLoaded, onFaceStatusChange]);

  return (
    <div className="lg:col-span-3 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 bg-black shadow-2xl group">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]" />

      <AnimatePresence>
        {isInitializing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-10 z-[50]">
            <div className="size-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em]">Initializing Engine...</h3>
          </motion.div>
        )}
        {!isInitializing && !faceDetected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/40 backdrop-blur-md flex flex-col items-center justify-center text-center p-10">
            <div className="size-20 rounded-full border-2 border-primary/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">face</span>
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">Face Not Detected</h3>
            <p className="text-xs text-slate-300 max-w-xs uppercase font-bold tracking-widest leading-loose">Position your head within the camera's view to initiate the liveness check.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
          <div className={`size-1.5 rounded-full ${faceDetected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-[8px] font-black uppercase text-white tracking-widest">{faceDetected ? "LOCKED" : "SCANNING"}</span>
        </div>
      </div>
    </div>
  );
}
