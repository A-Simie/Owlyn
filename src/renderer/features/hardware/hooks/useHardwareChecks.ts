import { useState, useEffect, useCallback } from "react";
import { useMediaStore } from "@/stores/media.store";
import { candidateApi } from "@/api/candidate.api";
import { apiClient } from "@/lib/api-client";

export function useHardwareChecks() {
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

  const [isInitializingMedia, setIsInitializingMedia] = useState(true);

  const [checks, setChecks] = useState({
    camera: true, 
    mic: true,
    network: false,
    singleDisplay: true,
  });

  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);

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

  // Sync state from MediaStore
  useEffect(() => {
    const videoActive = cameraOn && !!cameraStream;
    const micActive = micOn;
    setChecks((prev) => ({ 
      ...prev, 
      camera: videoActive || isInitializingMedia, 
      mic: micActive || isInitializingMedia,
    }));
  }, [cameraOn, micOn, cameraStream, isInitializingMedia]);

  // Auto-start media on mount
  useEffect(() => {
    const startAll = async () => {
      if (!cameraOn) await startCamera();
      if (!micOn) await startMic();
      setIsInitializingMedia(false);
    };
    startAll();
  }, []); // Only on mount

  const runNetworkTest = useCallback(async () => {
    setIsCheckingNetwork(true);
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
      setIsCheckingNetwork(false);
    }
  }, []);

  useEffect(() => {
    runNetworkTest();
  }, [runNetworkTest]);

  return {
    checks,
    networkLatency,
    isCheckingNetwork,
    isInitializingMedia,
    runNetworkTest,
    media: {
      cameraOn,
      micOn,
      cameraStream,
      audioLevel,
      startCamera,
      stopCamera,
      startMic,
      stopMic,
    }
  };
}
