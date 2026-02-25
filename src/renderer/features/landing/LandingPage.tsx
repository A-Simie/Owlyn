import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'


const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
}

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="bg-white dark:bg-[#0B0B0B] text-slate-900 dark:text-slate-100 selection:bg-primary selection:text-black overflow-x-hidden">
            {/* Header */}
            <motion.header
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="fixed top-0 w-full z-50 border-b divider bg-white/80 dark:bg-[#0B0B0B]/80 backdrop-blur-[12px]"
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                        <span className="text-2xl font-bold tracking-tighter text-heading">Owlyn</span>
                    </motion.div>
                    <nav className="hidden md:flex items-center gap-10">
                        {['Platform', 'Excellence', 'Enterprise'].map((item) => (
                            <motion.a
                                key={item}
                                whileHover={{ y: -1 }}
                                className="text-sm font-medium tracking-wide text-body hover:text-primary transition-colors cursor-pointer"
                            >
                                {item}
                            </motion.a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-6">

                        <button onClick={() => navigate('/auth')} className="text-sm font-medium text-body hover:text-primary transition-colors">Sign In</button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-primary text-black px-6 py-2.5 text-sm font-bold rounded-sm hover:brightness-110 transition-all uppercase tracking-widest"
                        >
                            Request Membership
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            <main className="pt-20">
                {/* Hero */}
                <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.08),transparent_70%)]" />

                    {/* Floating orbs */}
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"
                        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[80px]"
                        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <motion.div
                        className="relative z-10 max-w-4xl mx-auto"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            variants={fadeUp}
                            custom={0}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-8"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Aion AI Core v4.0 Active</span>
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            custom={1}
                            className="text-5xl md:text-7xl font-bold tracking-tight text-heading mb-8 leading-[1.1]"
                        >
                            The Future of Career <br />
                            <motion.span
                                className="text-primary italic font-light inline-block"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                Excellence
                            </motion.span>{' '}
                            is Multimodal.
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            custom={2}
                            className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12 font-light leading-relaxed"
                        >
                            Meet the AI agent that doesn't just ask questions — it listens, sees, and reasons with scholarly precision.
                        </motion.p>

                        <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 0 60px -10px rgba(197,159,89,0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full sm:w-auto bg-primary text-black px-10 py-4 text-base font-bold rounded-sm transition-all uppercase tracking-widest aion-glow"
                            >
                                Request Membership
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03, borderColor: 'rgba(197,159,89,0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full sm:w-auto border border-slate-200 dark:border-white/10 px-10 py-4 text-base font-bold rounded-sm transition-all uppercase tracking-widest bg-slate-50 dark:bg-white/5 text-heading"
                            >
                                View Demo
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {/* Aion Core Visual */}
                    <motion.div
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        className="relative mt-20 w-full max-w-5xl aspect-video rounded-xl border border-slate-200 dark:border-primary/20 surface-elevated overflow-hidden group"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative flex items-center justify-center w-64 h-64">
                                {[{ s: 1.5, o: 0.1 }, { s: 1.25, o: 0.2 }, { s: 1.1, o: 0.4 }].map((ring, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute inset-0 border-2 border-primary rounded-full"
                                        style={{ scale: ring.s, opacity: ring.o }}
                                        animate={{ scale: [ring.s, ring.s + 0.05, ring.s], opacity: [ring.o, ring.o + 0.1, ring.o] }}
                                        transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                ))}
                                <motion.div
                                    className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary via-primary/50 to-primary/20 flex items-center justify-center shadow-[0_0_50px_rgba(197,159,89,0.5)]"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                                >
                                    <motion.span
                                        className="material-symbols-outlined text-black text-5xl"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        cognition
                                    </motion.span>
                                </motion.div>
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-6 flex items-center gap-4 text-primary/60 text-[10px] tracking-widest uppercase font-mono">
                            {['Acoustic Sync', 'Vision Lattice', 'Logic Mesh'].map((label, i) => (
                                <motion.span
                                    key={label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.2 + i * 0.2, duration: 0.5 }}
                                    className="flex items-center gap-2"
                                >
                                    <motion.span
                                        className="w-1 h-1 bg-primary rounded-full"
                                        animate={{ scale: [1, 1.8, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                    />
                                    {label}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Features */}
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                    >
                        {[
                            { icon: 'visibility', title: 'Voice & Vision', desc: "Reactive follow-ups driven by computer vision and acoustic analysis. Owlyn interprets non-verbal cues to understand the candidate's true confidence." },
                            { icon: 'psychology', title: 'Real-time Reasoning', desc: 'Adaptive difficulty spikes that evolve based on candidate performance. The AI pivots instantly to explore the boundaries of technical expertise.' },
                            { icon: 'verified_user', title: 'Integrity Guard', desc: 'Multimodal security monitoring ensures the highest standards of excellence. Patent-pending detection for unauthorized AI assistance or external coaching.' },
                        ].map((f, i) => (
                            <motion.div
                                key={f.title}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -8, borderColor: 'rgba(197,159,89,0.4)' }}
                                className="p-8 surface-card rounded-lg transition-all group cursor-default"
                            >
                                <motion.div
                                    className="w-12 h-12 mb-6 flex items-center justify-center text-primary border border-primary/20 rounded-sm bg-primary/5 group-hover:bg-primary group-hover:text-black transition-all"
                                    whileHover={{ rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <span className="material-symbols-outlined">{f.icon}</span>
                                </motion.div>
                                <h3 className="text-xl font-bold text-heading mb-4 tracking-wide uppercase">{f.title}</h3>
                                <p className="text-muted leading-relaxed font-light">{f.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Protocol */}
                <section className="py-24 border-t divider bg-slate-50 dark:bg-[#0B0B0B]">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-heading mb-4 tracking-tight">The Owlyn Protocol</h2>
                            <p className="text-primary uppercase tracking-[0.3em] text-[11px] font-bold">A four-stage multimodal evaluation framework</p>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-80px' }}
                        >
                            {[
                                { num: 1, icon: 'settings_accessibility', title: 'Persona Engineering', desc: "Recruiters define the AI's personality, knowledge base, and specific evaluation criteria for the role." },
                                { num: 2, icon: 'fingerprint', title: 'Candidate Calibration', desc: 'A secure hardware and identity check ensures the candidate is ready and the environment is controlled.' },
                                { num: 3, icon: 'record_voice_over', title: 'Multimodal Interview', desc: "The live, real-time session where Owlyn listens, sees, and adapts to the candidate's responses." },
                                { num: 4, icon: 'analytics', title: 'Deep Intelligence', desc: 'AI-generated scores, competency radars, and transcript highlights are delivered instantly.' },
                            ].map((step, i) => (
                                <motion.div
                                    key={step.num}
                                    variants={fadeUp}
                                    custom={i}
                                    whileHover={{ y: -6 }}
                                    className="relative p-8 surface-card rounded-lg group transition-all"
                                >
                                    <motion.div
                                        className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/20"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 300 }}
                                    >
                                        {step.num}
                                    </motion.div>
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

                {/* Social Proof */}
                <section className="py-20 border-t divider bg-white/80 dark:bg-black/40 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-12"
                        >
                            Trusted by the world's most discerning talent partners
                        </motion.p>
                        <motion.div
                            className="flex flex-wrap justify-center items-center gap-12 md:gap-24"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            {['QUANTUM', 'STRATOS', 'Vanguard', 'AETHER', '/NODAL'].map((name, i) => (
                                <motion.div
                                    key={name}
                                    variants={fadeUp}
                                    custom={i}
                                    whileHover={{ opacity: 1, scale: 1.1 }}
                                    className="text-2xl font-bold tracking-tighter text-heading opacity-30 hover:opacity-100 transition-opacity cursor-default"
                                >
                                    {name}
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-32 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="max-w-5xl mx-auto bg-gradient-to-b from-slate-100 dark:from-charcoal to-white dark:to-background-dark border border-slate-200 dark:border-primary/20 p-12 md:p-24 rounded-sm text-center relative overflow-hidden"
                    >
                        <motion.div
                            className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-heading mb-8 tracking-tight">The elite waitlist is now open.</h2>
                            <p className="text-muted mb-12 max-w-xl mx-auto font-light">Join 500+ global enterprises redefining their executive search and technical vetting with multimodal intelligence.</p>
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 80px -15px rgba(197,159,89,0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-primary text-black px-12 py-5 text-lg font-bold rounded-sm transition-all uppercase tracking-[0.2em]"
                            >
                                Apply for Access
                            </motion.button>
                        </div>
                    </motion.div>
                </section>
            </main>

            <footer className="py-12 px-6 border-t divider">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                        <span className="text-lg font-bold tracking-tighter text-muted">Owlyn</span>
                    </div>
                    <div className="flex gap-10 text-[11px] uppercase tracking-widest font-bold text-subtle">
                        {['Platform', 'Privacy', 'Terms', 'Contact'].map((link) => (
                            <a key={link} className="hover:text-primary transition-colors cursor-pointer">{link}</a>
                        ))}
                    </div>
                    <p className="text-[11px] text-subtle font-medium tracking-wide">© 2024 Owlyn Systems. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
