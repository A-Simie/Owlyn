import { motion } from "framer-motion";
import AudioWaveform from "../../interview/components/AudioWaveform";

interface AssistantVisualizerProps {
  isSpeaking: boolean;
  isLarge: boolean;
  lastTranscript?: { id: string; text: string };
  isSharingScreen: boolean;
  error: string | null;
  onEnableMedia: () => void;
}

export function AssistantVisualizer({ 
  isSpeaking, 
  isLarge, 
  lastTranscript, 
  isSharingScreen, 
  error, 
  onEnableMedia 
}: AssistantVisualizerProps) {
  return (
    <div className={`${isLarge ? "h-[160px]" : "flex-1"} bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner flex-shrink-0`}>
      <div className="relative flex items-center justify-center scale-90">
        <AudioWaveform isActive={isSpeaking} color="#c59f59" />
      </div>
      
      <div className="text-center z-10 space-y-3 mt-4">
         <p className={`text-[8px] text-primary font-black uppercase tracking-[0.3em] ${isSpeaking ? "animate-pulse" : ""}`}>
           {isSpeaking ? "Speaking" : "Active"}
         </p>

         {!isLarge && lastTranscript && (
           <motion.div
             initial={{ opacity: 0, y: 5 }}
             animate={{ opacity: 1, y: 0 }}
             key={lastTranscript.id}
             className="max-w-[180px]"
           >
             <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic bg-white/5 p-2 rounded-lg border border-white/5 line-clamp-2">
               "{lastTranscript.text}"
             </p>
           </motion.div>
         )}
      </div>

      {!isSharingScreen && !error && (
        <div className="mt-3 text-center animate-pulse">
          <p className="text-[9px] text-amber-400 font-black uppercase tracking-[0.2em]">
            Initializing Assistant Mode...
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[8px] text-red-400 font-bold uppercase tracking-[0.12em] text-center max-w-[220px]">
          {error}
        </p>
      )}
    </div>
  );
}
