export function AssistantControls({ onEnd }: { onEnd: () => void }) {
  return (
    <button
      onClick={onEnd}
      className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
    >
      <span className="material-symbols-outlined text-[10px]">power_settings_new</span>
      Quit
    </button>
  );
}
