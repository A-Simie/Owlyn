import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../animations";

const FEATURES = [
  { icon: "visibility", title: "Voice & Vision", desc: "Reactive follow-ups driven by computer vision and acoustic analysis. Owlyn interprets non-verbal cues." },
  { icon: "psychology", title: "Real-time Reasoning", desc: "Adaptive difficulty spikes that evolve based on candidate performance. The AI pivots instantly." },
  { icon: "verified_user", title: "Integrity Guard", desc: "Multimodal security monitoring ensures the highest standards. Patent-pending detection." },
];

export function LandingFeatures() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
        {FEATURES.map((f, i) => (
          <motion.div key={f.title} variants={fadeUp} custom={i} className="p-8 surface-card rounded-lg transition-all group cursor-default border border-transparent hover:border-primary/40">
            <div className="w-12 h-12 mb-6 flex items-center justify-center text-primary border border-primary/20 rounded-sm bg-primary/5 group-hover:bg-primary group-hover:text-black transition-all">
              <span className="material-symbols-outlined">{f.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-heading mb-4 tracking-wide uppercase">{f.title}</h3>
            <p className="text-muted leading-relaxed font-light">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
