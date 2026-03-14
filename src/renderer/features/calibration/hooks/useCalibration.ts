import { useState, useEffect } from "react";

export function useCalibration(faceDetected: boolean) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!faceDetected || step >= 2) return;

    const timer = setTimeout(() => {
      setStep(s => s + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [faceDetected, step]);

  return { step, setStep };
}
