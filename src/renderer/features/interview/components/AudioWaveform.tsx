import { motion, AnimatePresence } from "framer-motion";

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
}

export default function AudioWaveform({ isActive, color = "#c59f59" }: AudioWaveformProps) {
  const bars = Array.from({ length: 16 });

  return (
    <div className="flex items-center justify-center gap-[4px] h-12 w-48 relative">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            height: isActive ? [8, 32, 16, 40, 12][i % 5] : 2, // Completely flat when standby
            opacity: isActive ? [0.4, 1, 0.6, 1, 0.4][i % 5] : 0.1, // Barely visible when standby
          }}
          transition={{
            duration: isActive ? 0.5 + i * 0.05 : 1,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
          }}
          style={{
            width: "3px",
            backgroundColor: color,
            borderRadius: "4px",
            boxShadow: isActive ? `0 0 15px ${color}60` : "none",
          }}
        />
      ))}
      
      {/* Glow pulse for active state */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
