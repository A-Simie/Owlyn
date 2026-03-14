export function AssistantHeader({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center justify-between px-1 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="size-3.5 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            owl
          </span>
        </div>
        <span className="text-[7.5px] font-black text-white/70 uppercase tracking-widest">Assistant</span>
      </div>
      <div className={`size-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
    </div>
  );
}
