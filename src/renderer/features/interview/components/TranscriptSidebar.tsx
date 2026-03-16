import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterviewStore } from "@/stores/interview.store";

export default function TranscriptSidebar() {
  const { transcript } = useInterviewStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Transcript Updated in Sidebar:", transcript.length, "messages total");
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Fallback Polling for high-latency updates
  useEffect(() => {
    const timer = setInterval(() => {
       if (scrollRef.current && transcript.length > 0) {
         // Force a minor scroll check
         const isAtBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 50;
         if (isAtBottom) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
         }
       }
    }, 2000);
    return () => clearInterval(timer);
  }, [transcript.length]);

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
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex flex-col ${message.speaker === "ai" ? "items-start" : "items-end"}`}
              >
                <div className={`flex items-center gap-2 mb-1.5 ${message.speaker === "ai" ? "flex-row" : "flex-row-reverse"}`}>
                   <div className={`size-1.5 rounded-full ${message.speaker === "ai" ? "bg-primary" : "bg-blue-400"} ${message.speaker === "ai" && "animate-pulse"}`} />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                     {message.speaker === "ai" ? "Owlyn" : "You (Candidate)"}
                   </span>
                </div>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[11px] leading-relaxed shadow-xl border ${
                  message.speaker === "ai" 
                    ? "bg-white/[0.04] border-white/10 text-slate-100 rounded-tl-none" 
                    : "bg-primary/10 border-primary/30 text-primary rounded-tr-none"
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
