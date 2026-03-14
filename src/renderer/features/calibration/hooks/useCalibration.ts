import { useState, useEffect } from "react";

export function useCalibration(faceDetected: boolean) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (faceDetected) {
      interval = setInterval(() => {
        setStep((s) => (s < 2 ? s + 1 : s));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [faceDetected]);

  return { step, setStep };
}
