import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 w-full z-50 border-b divider bg-white/80 dark:bg-[#0B0B0B]/80 backdrop-blur-[12px]"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
          <span className="text-2xl font-bold tracking-tighter text-heading">Owlyn</span>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          {["About", "Contact"].map((item) => (
            <a key={item} className="text-sm font-medium tracking-wide text-body hover:text-primary transition-colors cursor-pointer">{item}</a>
          ))}
        </nav>
        <button onClick={() => navigate("/auth")} className="bg-primary text-black px-6 py-2.5 text-sm font-bold rounded-xl hover:brightness-110 transition-all uppercase tracking-widest">
          Sign In
        </button>
      </div>
    </motion.header>
  );
}
