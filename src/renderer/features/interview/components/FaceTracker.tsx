import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

interface FaceTrackerProps {
  onWarning?: (message: string | null) => void;
  stream?: MediaStream | null;
}

export default function FaceTracker({ onWarning, stream }: FaceTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef(0);
  const lookAwayTimerRef = useRef<number | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState<"valid" | "warning" | "no-face">(
    "valid",
  );

  // Load models once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (!cancelled) setModelsLoaded(true);
      } catch (err) {
        console.error("Face-api model load failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Start webcam
  useEffect(() => {
    if (!modelsLoaded) return;
    if (stream) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => setCameraReady(true)).catch(console.error);
      }
      return;
    }

    let localStream: MediaStream | null = null;
    (async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    })();
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [modelsLoaded, stream]);

  const emitWarning = useCallback(
    (msg: string | null) => {
      onWarning?.(msg);
    },
    [onWarning],
  );

  // Detection loop
  useEffect(() => {
    if (!modelsLoaded || !cameraReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.4,
    });

    let running = true;

    const detect = async () => {
      if (!running || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks();

      // Match canvas to container
      const container = containerRef.current;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length === 0) {
        setStatus("no-face");
        emitWarning("Face not detected");
        if (lookAwayTimerRef.current) {
          clearTimeout(lookAwayTimerRef.current);
          lookAwayTimerRef.current = null;
        }
      } else {
        const detection = detections[0];
        const landmarks = detection.landmarks;
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Gaze: compare nose-to-left-jaw vs nose-to-right-jaw distance
        const noseTip = nose[3]; // tip of nose
        const leftJaw = jaw[0]; // leftmost jaw point
        const rightJaw = jaw[16]; // rightmost jaw point

        const distLeft = Math.abs(noseTip.x - leftJaw.x);
        const distRight = Math.abs(noseTip.x - rightJaw.x);
        const ratio =
          Math.min(distLeft, distRight) / Math.max(distLeft, distRight);

        // ratio < 0.45 means head is turned significantly
        const isLookingAway = ratio < 0.45;

        if (isLookingAway) {
          if (!lookAwayTimerRef.current) {
            lookAwayTimerRef.current = window.setTimeout(() => {
              setStatus("warning");
              emitWarning("Please return your focus to the screen");
            }, 1500);
          }
        } else {
          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
            lookAwayTimerRef.current = null;
          }
          setStatus("valid");
          emitWarning(null);
        }

        // Draw on canvas (scaled from video coords to canvas coords)
        const displayW = canvas.width;
        const displayH = canvas.height;
        const scaleX = displayW / video.videoWidth;
        const scaleY = displayH / video.videoHeight;

        const box = detection.detection.box;
        const color =
          status === "valid"
            ? "#22c55e"
            : status === "warning"
              ? "#ef4444"
              : "#ef4444";

        // Bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          box.x * scaleX,
          box.y * scaleY,
          box.width * scaleX,
          box.height * scaleY,
        );
        ctx.setLineDash([]);

        // Corner brackets
        const bx = box.x * scaleX;
        const by = box.y * scaleY;
        const bw = box.width * scaleX;
        const bh = box.height * scaleY;
        const cornerLen = 14;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Draw landmark dots
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        const allPoints = landmarks.positions;
        for (const pt of allPoints) {
          ctx.beginPath();
          ctx.arc(pt.x * scaleX, pt.y * scaleY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Eye highlights
        const eyeColor = status === "valid" ? "#c59f59" : "#ef4444";
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 12;
        for (const eye of [leftEye, rightEye]) {
          const cx =
            (eye.reduce((s: number, p: { x: number }) => s + p.x, 0) / eye.length) * scaleX;
          const cy =
            (eye.reduce((s: number, p: { y: number }) => s + p.y, 0) / eye.length) * scaleY;
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Nose bridge line
        ctx.strokeStyle = "rgba(197, 159, 89, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(nose[0].x * scaleX, nose[0].y * scaleY);
        for (let i = 1; i < nose.length; i++) {
          ctx.lineTo(nose[i].x * scaleX, nose[i].y * scaleY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (running) {
        await new Promise((r) => setTimeout(r, 120)); // ~8fps detection
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      if (lookAwayTimerRef.current) clearTimeout(lookAwayTimerRef.current);
    };
  }, [modelsLoaded, cameraReady, emitWarning, status]);

  const borderColor =
    status === "valid"
      ? "border-green-500/30"
      : status === "warning"
        ? "border-red-500/50 animate-pulse"
        : "border-red-500/50 animate-pulse";

  const glowShadow =
    status === "valid"
      ? "shadow-[0_0_15px_rgba(34,197,94,0.15)]"
      : "shadow-[0_0_15px_rgba(239,68,68,0.2)]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span
          className={`${status === "valid" ? "text-green-500" : "text-red-500"} animate-pulse`}
        >
          {status === "valid"
            ? "Tracking Active"
            : status === "no-face"
              ? "No Face"
              : "Warning"}
        </span>
      </div>
      <div
        ref={containerRef}
        className={`relative aspect-video rounded-sm overflow-hidden border ${borderColor} bg-black ${glowShadow} transition-all duration-500`}
      >
        {!modelsLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-[8px] font-bold text-primary/50 uppercase tracking-widest">
              Loading Models...
            </span>
          </div>
        ) : null}
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
    </div>
  );
}
