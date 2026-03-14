import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LiveKitRoom, 
  useRoomContext,
  useLocalParticipant,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { RoomEvent, ConnectionState } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { useCandidateStore } from "@/stores/candidate.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useMediaStore } from "@/stores/media.store";
import AudioWaveform from "../interview/components/AudioWaveform";

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
  const navigate = useNavigate();
  const { 
    addTranscript, 
    setCurrentQuestion, 
    reset: resetInterview, 
    isAiSpeaking, 
    setAiSpeaking 
  } = useInterviewStore();
  const { clearSession } = useCandidateStore();
  const { stopAll } = useMediaStore();
  
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const [isConnected, setIsConnected] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("Standby");
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localParticipant || room.state !== ConnectionState.Connected) return;

    const autoStart = async () => {
      try {
        await localParticipant.setMicrophoneEnabled(true);
      } catch (err) {
        console.warn("Microphone access failed", err);
        setError("Microphone required");
      }
    };

    autoStart();
  }, [localParticipant, room.state]);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        switch (msg.type) {
          case "transcript":
            addTranscript({
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              speaker: msg.speaker,
              text: msg.text,
            });
            if (msg.speaker === "ai") setCurrentQuestion(msg.text);
            break;
          case "AI_VISUALIZER_STATUS":
            setAiStatus(msg.status);
            break;
          case "AI_SPEAKING":
            setAiSpeaking(msg.active);
            break;
        }
      } catch (err) {
        console.warn("AI command error:", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);

    const checkAndSignal = () => {
      if (room.state === ConnectionState.Connected) {
        const participant = room.localParticipant;
        const encoder = new TextEncoder();
        participant.publishData(
          encoder.encode(JSON.stringify({ event: "USER_JOINED" })), 
          { reliable: true }
        );
        setIsConnected(true);
      }
    };

    if (room.state === ConnectionState.Connected) checkAndSignal();
    room.on(RoomEvent.Connected, checkAndSignal);
    room.on(RoomEvent.Disconnected, () => setIsConnected(false));

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Connected, checkAndSignal);
    };
  }, [room, addTranscript, setCurrentQuestion, setAiSpeaking]);

  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);

    if (window.owlyn?.window?.setWidgetMode) {
      await window.owlyn.window.setWidgetMode(false);
    }

    await room?.disconnect();
    stopAll();
    resetInterview();
    clearSession();
    navigate("/auth?step=candidate-options");
  };

  return (
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col p-4 space-y-4 overflow-hidden border border-white/5 shadow-2xl">
      {/* Mini Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              owl
            </span>
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Assistant</span>
        </div>
        <div className={`size-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      </div>

      {/* Visualizer */}
      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(197,159,89,0.02),transparent_70%)]" />
        
        <div className="relative">
          
        </div>

        <div className="text-center z-10 px-4">
          <motion.div
            initial={false}
            animate={{ scale: isAiSpeaking ? 1.05 : 1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isAiSpeaking ? [4, 12, 4] : 4
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                  className="w-1 bg-primary/40 rounded-full"
                />
              ))}
            </div>
          </motion.div>
          {error && <p className="text-[8px] text-red-500 font-bold uppercase mt-2 tracking-widest">{error}</p>}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleEnd}
        className="w-full py-3.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
      >
        <span className="material-symbols-outlined text-[14px]">power_settings_new</span>
        End Mode
      </button>
    </div>
  );
}
