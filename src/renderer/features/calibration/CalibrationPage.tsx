import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMediaStore } from "@/stores/media.store";
import { CalibrationCamera } from "./components/CalibrationCamera";
import { CalibrationStepList } from "./components/CalibrationStepList";
import { useCalibration } from "./hooks/useCalibration";

export default function CalibrationPage() {
  const navigate = useNavigate();
  const { startCamera, cameraStream, cameraOn } = useMediaStore();
  const [faceDetected, setFaceDetected] = useState(false);
  const { step } = useCalibration(faceDetected);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

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
          <CalibrationCamera 
            cameraOn={cameraOn} 
            cameraStream={cameraStream} 
            onFaceStatusChange={setFaceDetected} 
          />

          <div className="lg:col-span-2 space-y-8">
            <CalibrationStepList currentStep={step} />

            <button
              onClick={() => navigate("/hardware")}
              disabled={step < 2 || !faceDetected}
              className="w-full py-5 bg-primary text-black font-black uppercase rounded-xl tracking-[0.4em] text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl shadow-primary/20"
            >
              Continue to Diagnostic
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
