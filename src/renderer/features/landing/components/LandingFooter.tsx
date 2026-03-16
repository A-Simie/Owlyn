export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-6 border-t divider">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-xl opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
          <span className="text-lg font-bold tracking-tighter text-muted">Owlyn</span>
        </div>
        <div className="flex gap-10 text-[11px] uppercase tracking-widest font-bold text-subtle">
          {["About", "Privacy", "Terms", "Contact"].map((link) => (
            <a key={link} className="hover:text-primary transition-colors cursor-pointer">{link}</a>
          ))}
        </div>
        <p className="text-[11px] text-subtle font-medium tracking-wide">© {currentYear} Owlyn. All rights reserved.</p>
      </div>
    </footer>
  );
}
