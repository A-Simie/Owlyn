import { create } from "zustand";

interface MediaState {
  cameraStream: MediaStream | null;
  micStream: MediaStream | null;
  screenStream: MediaStream | null;
  cameraOn: boolean;
  micOn: boolean;
  screenOn: boolean;
  audioLevel: number;
  cameraError: string | null;
  micError: string | null;
  screenError: string | null;
  displayCount: number;

  startCamera: (deviceId?: string) => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopCamera: () => void;
  stopScreenShare: () => void;
  startMic: (deviceId?: string) => Promise<void>;
  stopMic: () => void;
  setAudioLevel: (level: number) => void;
  setDisplayCount: (count: number) => void;
  stopAll: () => void;
}

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let animFrameId = 0;

export const useMediaStore = create<MediaState>((set, get) => ({
  cameraStream: null,
  micStream: null,
  screenStream: null,
  cameraOn: false,
  micOn: false,
  screenOn: false,
  audioLevel: 0,
  cameraError: null,
  micError: null,
  screenError: null,
  displayCount: 1,

  startCamera: async (deviceId) => {
    const { cameraOn, stopCamera } = get();
    if (cameraOn) stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      set({ cameraStream: stream, cameraOn: true, cameraError: null });
    } catch (err) {
      set({
        cameraError:
          err instanceof Error ? err.message : "Camera access denied",
      });
    }
  },

  startScreenShare: async () => {
    const { screenOn, stopScreenShare } = get();
    if (screenOn) stopScreenShare();
    try {
      let sourceId: string | undefined;
      if (window.owlyn?.desktop?.getSources) {
        const sources = await window.owlyn.desktop.getSources();
        const screenSources = sources.filter((s: any) => s.name.toLowerCase().includes("screen"));
        sourceId = screenSources[0]?.id || sources[0]?.id;
      }

      const stream = await (navigator.mediaDevices as any).getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
          },
        },
      });
      set({ screenStream: stream, screenOn: true, screenError: null });
    } catch (err) {
      set({
        screenError: err instanceof Error ? err.message : "Screen share denied",
      });
      throw err;
    }
  },

  stopCamera: () => {
    const { cameraStream } = get();
    cameraStream?.getVideoTracks().forEach((t) => t.stop());
    set({ cameraStream: null, cameraOn: false });
  },

  stopScreenShare: () => {
    const { screenStream } = get();
    screenStream?.getVideoTracks().forEach((t) => t.stop());
    set({ screenStream: null, screenOn: false });
  },

  startMic: async (deviceId) => {
    const { micOn, stopMic } = get();
    if (micOn) stopMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });

      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const poll = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        set({ audioLevel: avg / 255 });
        animFrameId = requestAnimationFrame(poll);
      };
      poll();

      set({ micStream: stream, micOn: true, micError: null });
    } catch (err) {
      set({
        micError:
          err instanceof Error ? err.message : "Microphone access denied",
      });
    }
  },

  stopMic: () => {
    cancelAnimationFrame(animFrameId);
    const { micStream } = get();
    micStream?.getAudioTracks().forEach((t) => t.stop());
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close();
    }
    audioCtx = null;
    analyser = null;
    set({ micStream: null, micOn: false, audioLevel: 0 });
  },

  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setDisplayCount: (displayCount) => set({ displayCount }),

  stopAll: () => {
    get().stopCamera();
    get().stopMic();
    get().stopScreenShare();
  },
}));
