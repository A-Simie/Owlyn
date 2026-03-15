import { LandingHeader } from "./components/LandingHeader";
import { LandingHero } from "./components/LandingHero";
import { LandingFeatures } from "./components/LandingFeatures";
import { LandingFooter } from "./components/LandingFooter";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./animations";

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-[#0B0B0B] text-slate-900 dark:text-slate-100 selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      <LandingHeader />

      <main className="pt-20">
        <LandingHero />
        <LandingFeatures />

        {/* Protocol Section */}
        <section className="py-24 border-t divider bg-slate-50 dark:bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-heading mb-4 tracking-tight">The Owlyn Protocol</h2>
              <p className="text-primary uppercase tracking-[0.3em] text-[11px] font-bold">A four-stage multimodal evaluation framework</p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {PROTOCOL_STEPS.map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} custom={i} className="relative p-8 surface-card rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <div className="text-primary mb-6">
                    <span className="material-symbols-outlined text-4xl">{step.icon}</span>
                  </div>
                  <h4 className="text-lg font-bold text-heading mb-3 uppercase tracking-wide">{step.title}</h4>
                  <p className="text-muted text-sm leading-relaxed font-light">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
    </main>

      <LandingFooter />
    </div>
  );
}

const PROTOCOL_STEPS = [
  { num: 1, icon: "settings_accessibility", title: "Persona Engineering", desc: "Recruiters define the AI's personality and evaluation criteria." },
  { num: 2, icon: "fingerprint", title: "Candidate Calibration", desc: "Secure hardware and identity checks ensure the candidate is ready." },
  { num: 3, icon: "record_voice_over", title: "Multimodal Interview", desc: "The live real-time session where Owlyn listens, sees, and adapts." },
  { num: 4, icon: "analytics", title: "Deep Intelligence", desc: "AI-generated scores and radars are delivered instantly." },
];
