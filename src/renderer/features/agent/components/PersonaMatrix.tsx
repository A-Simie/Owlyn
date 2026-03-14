interface PersonaMatrixProps {
  sliders: { empathy: number; analytical: number; directness: number };
  onChange: (key: "empathy" | "analytical" | "directness", value: number) => void;
}

export function PersonaMatrix({ sliders, onChange }: PersonaMatrixProps) {
  const SLIDERS = [
    { left: "Strictness", right: "Empathy", value: sliders.empathy, key: "empathy" as const, leftLabel: "CHALLENGING", rightLabel: "SUPPORTIVE" },
    { left: "Cultural Fit", right: "Analytical Depth", value: sliders.analytical, key: "analytical" as const, leftLabel: "BEHAVIORAL", rightLabel: "TECHNICAL" },
    { left: "Collaboration", right: "Directness", value: sliders.directness, key: "directness" as const, leftLabel: "ENGAGING", rightLabel: "CONCISE" },
  ];

  return (
    <div className="glass-panel rounded-2xl p-8 border border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-3 mb-10">
        <span className="material-symbols-outlined text-primary text-xl">tune</span>
        <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Personality Matrix</h3>
      </div>
      <div className="space-y-12">
        {SLIDERS.map((slider) => (
          <div key={slider.key} className="space-y-4">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
              <span className={slider.value < 50 ? "text-primary" : "text-slate-500"}>{slider.left}</span>
              <span className={slider.value >= 50 ? "text-primary transition-all" : "text-slate-500"}>{slider.right}</span>
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="100"
                value={slider.value}
                onChange={(e) => onChange(slider.key, parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 font-bold tracking-[0.2em]">
              <span>{slider.leftLabel}</span>
              <span>{slider.value}% {slider.right}</span>
              <span>{slider.rightLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
