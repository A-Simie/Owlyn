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
    if (stream === null) return; // Wait for external stream
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
      } else if (detections.length > 1) {
        setStatus("warning");
        emitWarning("Multiple faces detected. Please ensure you are alone.");
      } else {
        const detection = detections[0];
        const landmarks = detection.landmarks;
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();
        const mouth = landmarks.getMouth();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Gaze: compare nose-to-left-jaw vs nose-to-right-jaw distance
        const noseTip = nose[3];
        const leftJaw = jaw[0];
        const rightJaw = jaw[16];
        const distLeft = Math.abs(noseTip.x - leftJaw.x);
        const distRight = Math.abs(noseTip.x - rightJaw.x);
        const horizontalRatio = Math.min(distLeft, distRight) / Math.max(distLeft, distRight);

        // Vertical Gaze: compare nose-to-chin vs nose-to-eyebrow
        const chin = jaw[8];
        const noseBridge = nose[0];
        const distNoseChin = Math.abs(noseTip.y - chin.y);
        const distNoseBridge = Math.abs(noseTip.y - noseBridge.y);
        const verticalRatio = distNoseBridge / distNoseChin;

        const isLookingAway = horizontalRatio < 0.45;
        const isLookingDown = verticalRatio < 0.35; 
        
        // Improved Occlusion / Landmark loss check
        const mouthLandmarks = landmarks.getMouth();
        const noseLandmarks = landmarks.getNose();
        
        // If landmarks are physically improbable or missing
        const isObscured = !mouthLandmarks || !noseLandmarks || mouthLandmarks.length < 5;

        if (isLookingAway || isLookingDown || isObscured) {
          if (!lookAwayTimerRef.current) {
            lookAwayTimerRef.current = window.setTimeout(() => {
              setStatus("warning");
              let msg = "Please return your focus to the screen";
              if (isLookingDown) msg = "Avoid looking down or using external devices";
              if (isObscured) msg = "Please ensure your mouth and nose are visible";
              emitWarning(msg);
            }, 1000);
          }
        } else {
          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
            lookAwayTimerRef.current = null;
          }
          setStatus("valid");
          emitWarning(null);
        }
      }

      if (running) {
        await new Promise((r) => setTimeout(r, 250)); // ~4fps detection for performance
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
