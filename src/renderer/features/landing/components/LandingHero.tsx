import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fadeUp, staggerContainer, scaleIn } from "../animations";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.08),transparent_70%)]" />
      
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 max-w-4xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 mt-10 rounded-full border border-primary/30 bg-primary/5 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Owlyn AI</span>
        </motion.div>

        <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-bold tracking-tight text-heading mb-8 leading-[1.1]">
          The Future of Technical <br />
          <motion.span className="text-primary font-light inline-block" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>Excellence</motion.span> is Multimodal.
        </motion.h1>

        <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          An autonomous multimodal agent ecosystem that conducts live interviews, provides real-time assistance, and generates structured technical evaluation reports.
        </motion.p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 60px -10px rgba(197,159,89,0.5)" }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/auth")} className="w-full sm:w-auto bg-primary text-black px-10 py-4 text-base font-bold rounded-xl transition-all uppercase tracking-widest">Sign In</motion.button>
          <button className="w-full sm:w-auto border rounded-xl border-slate-200 dark:border-white/10 px-10 py-4 text-base font-bold transition-all uppercase tracking-widest bg-slate-50 dark:bg-white/5 text-heading">View Demo</button>
        </div>
      </motion.div>

      <motion.div variants={scaleIn} initial="hidden" animate="visible" className="relative mt-20 w-full max-w-5xl aspect-video rounded-xl border border-slate-200 dark:border-primary/20 surface-elevated overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-64 h-64">
            {[1.5, 1.25, 1.1].map((s, i) => (
              <motion.div key={i} className="absolute inset-0 border-2 border-primary rounded-full" style={{ scale: s, opacity: 0.1 + i * 0.1 }} animate={{ scale: [s, s + 0.05, s], opacity: [0.1 + i * 0.1, 0.2 + i * 0.1, 0.1 + i * 0.1] }} transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }} />
            ))}
            <motion.div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary via-primary/50 to-primary/20 flex items-center justify-center shadow-[0_0_50px_rgba(197,159,89,0.5)]" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
              <motion.span className="material-symbols-outlined text-black text-5xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>cognition</motion.span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
