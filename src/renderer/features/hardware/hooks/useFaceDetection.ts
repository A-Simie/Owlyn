import { useState, useEffect, RefObject } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

export function useFaceDetection(videoRef: RefObject<HTMLVideoElement>, cameraOn: boolean) {
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isInitializingModels, setIsInitializingModels] = useState(true);

  useEffect(() => {
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

      try {
        const detections = await faceapi.detectAllFaces(video, options);
        setFaceDetected(detections.length > 0);
      } catch (e) {
        // Silently skip if detection fails a frame
      }

      rafId = requestAnimationFrame(detect);
    };

    detect();
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [cameraOn, modelsLoaded, videoRef]);

  return { faceDetected, modelsLoaded, isInitializingModels };
}
