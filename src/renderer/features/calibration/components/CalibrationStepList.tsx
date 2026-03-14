import { motion } from "framer-motion";

const steps = [
  { title: "Enable Vision", desc: "Allow camera access to begin identity sync." },
  { title: "Position Frame", desc: "Ensure your face is centered within the focus ring." },
  { title: "Environmental Check", desc: "Optimal lighting detected for biometric monitoring." },
];

interface CalibrationStepListProps {
  currentStep: number;
}

export function CalibrationStepList({ currentStep }: CalibrationStepListProps) {
  return (
    <div className="space-y-6">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: i <= currentStep ? 1 : 0.2,
            x: 0,
            scale: i === currentStep ? 1.02 : 1,
          }}
          className={`p-6 rounded-2xl border transition-all ${i === currentStep ? "bg-primary/5 border-primary/40 shadow-xl shadow-primary/5" : "bg-white/[0.02] border-white/5"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-[10px] font-black ${i < currentStep ? "bg-green-500 text-black" : i === currentStep ? "bg-primary text-black" : "bg-white/5 text-slate-500"}`}
            >
              {i < currentStep ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                i + 1
              )}
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-widest ${i <= currentStep ? "text-white" : "text-slate-600"}`}>
                {s.title}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-1">
                {s.desc}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
