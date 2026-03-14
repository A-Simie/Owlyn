import { motion } from "framer-motion";

interface CandidateOptionsProps {
  onBack: () => void;
  onSelectAction: (action: "code" | "practice" | "tutor") => void;
}

export function CandidateOptions({ onBack, onSelectAction }: CandidateOptionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="text-center space-y-4">
        <button onClick={onBack} className="group inline-flex items-center gap-2 text-slate-500 hover:text-[#c59f59] text-[10px] uppercase tracking-widest font-bold transition-all">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to selection
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Candidate Entry</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <OptionButton 
          icon="pin" 
          title="Enter Code" 
          desc="Join a scheduled session." 
          color="primary" 
          onClick={() => onSelectAction("code")} 
        />
        <OptionButton 
          icon="science" 
          title="Practice" 
          desc="Test skills in mock session." 
          color="green" 
          onClick={() => onSelectAction("practice")} 
        />
        <OptionButton 
          icon="owl" 
          title="AI Assistant" 
          desc="AI assistant for everyday work." 
          color="blue" 
          onClick={() => onSelectAction("tutor")} 
        />
      </div>
    </motion.div>
  );
}

function OptionButton({ icon, title, desc, color, onClick }: { icon: string; title: string; desc: string; color: "primary" | "green" | "blue"; onClick: () => void }) {
  const colors = {
    primary: "text-primary border-primary/20 bg-primary/5 group-hover:bg-primary",
    green: "text-green-500 border-green-500/20 bg-green-500/5 group-hover:bg-green-500",
    blue: "text-blue-500 border-blue-500/20 bg-blue-500/5 group-hover:bg-blue-500",
  };
  const borderColors = {
    primary: "group-hover:border-primary/40",
    green: "group-hover:border-green-500/40",
    blue: "group-hover:border-blue-500/40",
  };

  return (
    <div onClick={onClick} className={`group relative p-8 bg-[#161616]/40 border border-white/5 rounded-[32px] ${borderColors[color]} transition-all cursor-pointer text-center space-y-4`}>
      <div className={`w-14 h-14 mx-auto flex items-center justify-center border rounded-sm ${colors[color]} group-hover:text-black transition-all`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white uppercase tracking-wide">{title}</h3>
        <p className="text-slate-500 text-[10px] font-light leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
