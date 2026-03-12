import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterviewStore } from "@/stores/interview.store";

export default function TranscriptSidebar() {
  const { transcript } = useInterviewStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-md">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-20">
              <span className="material-symbols-outlined text-4xl">forum</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Awaiting Dialogue</span>
            </div>
          ) : (
            transcript.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, x: message.speaker === "ai" ? -10 : 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                className={`flex flex-col ${message.speaker === "ai" ? "items-start" : "items-end"}`}
              >
                <span className={`text-[7px] font-black uppercase tracking-widest mb-1 ${message.speaker === "ai" ? "text-primary" : "text-slate-500"}`}>
                  {message.speaker === "ai" ? "Owlyn Core" : "Candidate"}
                </span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[11px] leading-relaxed shadow-lg ${
                  message.speaker === "ai" 
                    ? "bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none" 
                    : "bg-primary/10 border border-primary/20 text-primary rounded-tr-none"
                }`}>
                  {message.text}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
