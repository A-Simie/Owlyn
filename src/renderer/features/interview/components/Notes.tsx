import { useState, useEffect } from "react";

export default function Notes() {
  const [text, setText] = useState(
    () => localStorage.getItem("owlyn_notes") || "",
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("owlyn_notes", text);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div className="h-full w-full bg-[#0D0D0D] p-8 flex flex-col gap-6 font-sans">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#c59f59]">
            edit_note
          </span>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
            Scratchpad
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
          Auto-saving
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your notes, thoughts, or pseudo-code here..."
        className="flex-1 bg-transparent border-none outline-none resize-none text-slate-300 text-lg leading-relaxed font-light placeholder:text-slate-700 custom-scrollbar"
        spellCheck={false}
      />
    </div>
  );
}
