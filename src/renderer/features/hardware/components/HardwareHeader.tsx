export function HardwareHeader() {
  return (
    <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 bg-[#0D0D0D] z-20">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            owl
          </span>
        </div>
        <span className="text-sm font-black uppercase tracking-widest text-white">
          Owlyn
        </span>
      </div>
    </header>
  );
}
