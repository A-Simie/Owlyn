import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LiveKitRoom, 
  useRemoteParticipants,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { motion } from "framer-motion";
import { useCandidateStore } from "@/stores/candidate.store";
import { useInterviewStore } from "@/stores/interview.store";
import TranscriptSidebar from "../interview/components/TranscriptSidebar";
import { useAssistantSession } from "./hooks/useAssistantSession";
import { AssistantHeader } from "./components/AssistantHeader";
import { AssistantVisualizer } from "./components/AssistantVisualizer";
import { AssistantControls } from "./components/AssistantControls";

export default function AssistantPage() {
  const { livekitToken } = useCandidateStore();
  const navigate = useNavigate();

  if (!livekitToken) {
    navigate("/auth?step=candidate-options");
    return null;
  }

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      className="h-screen w-full bg-[#0B0B0B]"
    >
      <AssistantInterface />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function AssistantInterface() {
  const { 
    isAiSpeaking: isAiSpeakingStore,
    transcript: transcripts 
  } = useInterviewStore();
  
  const lastTranscript = transcripts[transcripts.length - 1];
  const remoteParticipants = useRemoteParticipants();
  const isAiSpeakingLive = remoteParticipants.some(p => p.isSpeaking);
  const isSpeaking = isAiSpeakingStore || isAiSpeakingLive;
  
  const { 
    isConnected, 
    error, 
    isSharingScreen, 
    enableAssistantMedia, 
    handleEnd 
  } = useAssistantSession();

  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsLarge(window.innerHeight > 450);
    window.addEventListener('resize', checkSize);
    checkSize();
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col p-2 space-y-2 overflow-hidden border border-white/5 shadow-2xl rounded-xl font-sans">
      <AssistantHeader isConnected={isConnected} />

      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <AssistantVisualizer 
          isSpeaking={isSpeaking}
          isLarge={isLarge}
          lastTranscript={lastTranscript}
          isSharingScreen={isSharingScreen}
          error={error}
          onEnableMedia={enableAssistantMedia}
        />
        
        {isLarge && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-black/20 border border-white/5 rounded-xl overflow-hidden min-h-0"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dialogue Feed</span>
              <span className="material-symbols-outlined text-slate-600 text-[12px]">forum</span>
            </div>
            <div className="flex-1 h-[calc(100%-36px)]">
              <TranscriptSidebar />
            </div>
          </motion.div>
        )}
      </div>

      <AssistantControls onEnd={handleEnd} />
    </div>
  );
}
