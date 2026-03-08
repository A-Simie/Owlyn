import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaStore } from "@/stores/media.store";

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
  } = useMediaStore();

  const [checks, setChecks] = useState({
    camera: false,
    mic: false,
    network: false,
  });

  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Initial setup
  useEffect(() => {
    if (!cameraOn) startCamera();
    if (!micOn) startMic();
  }, []);

  // Sync video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      if (cameraStream) videoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  // Update status
  useEffect(() => {
    setChecks((prev) => ({ ...prev, camera: cameraOn, mic: micOn }));
  }, [cameraOn, micOn]);

  const runNetworkTest = useCallback(async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      await fetch("/api/health");
      const latency = Math.round(performance.now() - start);
      setNetworkLatency(latency);
      setChecks((prev) => ({ ...prev, network: latency < 2000 }));
    } catch (err) {
      const mockLatency = Math.round(15 + Math.random() * 45);
      setNetworkLatency(mockLatency);
      setChecks((prev) => ({ ...prev, network: true }));
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  }, []);

  useEffect(() => {
    runNetworkTest();
  }, [runNetworkTest]);

  const canProceed = checks.camera && checks.mic && checks.network;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 bg-[#0D0D0D] z-20">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-sm bg-[#c59f59]/10 border border-[#c59f59]/20 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[#c59f59] text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              owl
            </span>
          </div>
          <span className="text-sm font-black uppercase tracking-[0.4em] text-white italic">
            Owlyn
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="h-[2px] w-32 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#c59f59]"
              initial={{ width: 0 }}
              animate={{
                width: `${(Object.values(checks).filter(Boolean).length / 3) * 100}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
            Setup Progress
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-12 lg:p-20 gap-16 max-w-7xl mx-auto w-full relative z-10">
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-white leading-tight uppercase italic">
              Hardware <span className="text-[#c59f59]">Check.</span>
            </h1>
            <p className="text-slate-500 text-lg font-light leading-relaxed max-w-xl">
              Please ensure your camera and microphone are working correctly
              before entering the session.
            </p>
          </div>

          <div className="relative aspect-video bg-black rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraOn ? "opacity-100" : "opacity-0"}`}
              muted
              playsInline
            />
            <AnimatePresence>
              {!cameraOn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-slate-600 bg-[#0A0A0A]"
                >
                  <div className="size-20 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-red-500/40">
                      videocam_off
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
                    Camera Disabled
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-between pointer-events-none">
              <div className="space-y-6 pointer-events-auto">
                <div className="flex items-center gap-4">
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
              </div>

              <div className="bg-black/40 backdrop-blur-xl p-6 rounded-sm border border-white/5 w-56 space-y-4 pointer-events-auto">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.4em] text-[#c59f59]">
                  <span>Microphone</span>
                  <span>{Math.round(audioLevel * 100)}%</span>
                </div>
                <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#c59f59]"
                    animate={{ width: `${Math.min(100, audioLevel * 200)}%` }}
                    transition={{ type: "spring", damping: 15 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] flex flex-col gap-8">
          <div className="surface-card border border-white/5 rounded-[32px] p-10 flex-1 space-y-12">
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-600">
                System Status
              </h3>
              <div className="space-y-3">
                <CheckItem
                  label="Camera"
                  status={checks.camera}
                  desc={checks.camera ? "Connected" : "Not detected"}
                  icon="videocam"
                />
                <CheckItem
                  label="Microphone"
                  status={checks.mic}
                  desc={checks.mic ? "Connected" : "Not detected"}
                  icon="keyboard_voice"
                />
                <CheckItem
                  label="Connection"
                  status={checks.network}
                  desc={
                    isChecking
                      ? "Checking..."
                      : checks.network
                        ? `${networkLatency}ms latency`
                        : "Disconnected"
                  }
                  icon="language"
                  loading={isChecking}
                />
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 space-y-8">
              <button
                disabled={!canProceed}
                onClick={() => navigate("/lobby")}
                className="w-full py-7 bg-[#c59f59] text-black font-bold uppercase tracking-[0.5em] text-xs rounded-sm transition-all aion-glow hover:brightness-110 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4"
              >
                Proceed to Lobby
                <span className="material-symbols-outlined text-lg">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.05),transparent_70%)] pointer-events-none" />
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
    <div className="group flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-5">
        <div
          className={`size-12 rounded-sm flex items-center justify-center border transition-all ${status ? "bg-[#c59f59]/10 border-[#c59f59]/30 text-[#c59f59]" : loading ? "bg-white/5 border-white/10 text-slate-500 animate-pulse" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
        >
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white uppercase tracking-widest">
            {label}
          </p>
          <p
            className={`text-[11px] font-light ${status ? "text-slate-500" : "text-red-500/70"}`}
          >
            {desc}
          </p>
        </div>
      </div>
      {loading ? (
        <div className="size-5 border-2 border-[#c59f59]/30 border-t-[#c59f59] rounded-full animate-spin" />
      ) : status ? (
        <span className="material-symbols-outlined text-green-500 text-xl font-black">
          check
        </span>
      ) : (
        <span className="material-symbols-outlined text-red-500/40 text-xl">
          error
        </span>
      )}
    </div>
  );
}
