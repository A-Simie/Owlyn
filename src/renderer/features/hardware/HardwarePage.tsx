import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HardwareHeader } from "./components/HardwareHeader";
import { HardwarePreview } from "./components/HardwarePreview";
import { HardwareSystemStatus } from "./components/HardwareSystemStatus";
import { useHardwareChecks } from "./hooks/useHardwareChecks";
import { useFaceDetection } from "./hooks/useFaceDetection";

export default function HardwarePage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    checks,
    networkLatency,
    isCheckingNetwork,
    runNetworkTest,
    media,
  } = useHardwareChecks();

  const { faceDetected, isInitializingModels } = useFaceDetection(videoRef, media.cameraOn);

  const canProceed = 
    checks.camera && 
    checks.mic && 
    checks.network && 
    faceDetected && 
    checks.singleDisplay;

  const handleToggleCamera = () => {
    if (media.cameraOn) media.stopCamera();
    else media.startCamera();
  };

  const handleToggleMic = () => {
    if (media.micOn) media.stopMic();
    else media.startMic();
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col font-sans overflow-hidden">
      <HardwareHeader />

      <main className="flex-1 flex flex-col lg:flex-row p-12 lg:p-20 gap-16 max-w-7xl mx-auto w-full relative z-10">
        <HardwarePreview
          videoRef={videoRef}
          cameraOn={media.cameraOn}
          micOn={media.micOn}
          cameraStream={media.cameraStream}
          audioLevel={media.audioLevel}
          faceDetected={faceDetected}
          isInitializingModels={isInitializingModels}
          onToggleCamera={handleToggleCamera}
          onToggleMic={handleToggleMic}
        />

        <HardwareSystemStatus
          checks={checks}
          networkLatency={networkLatency}
          isCheckingNetwork={isCheckingNetwork}
          onRefreshNetwork={runNetworkTest}
          canProceed={canProceed}
          onContinue={() => navigate("/lobby")}
        />
      </main>
    </div>
  );
}
