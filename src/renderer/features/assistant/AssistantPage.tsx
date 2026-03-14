import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LiveKitRoom, 
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { RoomEvent, ConnectionState } from "livekit-client";
import { motion } from "framer-motion";
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
    isAiSpeaking: isAiSpeakingStore,
    setAiSpeaking 
  } = useInterviewStore();
  const remoteParticipants = useRemoteParticipants();
  const isAiSpeakingLive = remoteParticipants.some(p => p.isSpeaking);
  const isSpeaking = isAiSpeakingStore || isAiSpeakingLive;
  const { clearSession } = useCandidateStore();
  const { stopAll } = useMediaStore();
  
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const [isConnected, setIsConnected] = useState(false);
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
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col p-3 space-y-3 overflow-hidden border border-white/5 shadow-2xl">
      {/* Mini Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              owl
            </span>
          </div>
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Assistant</span>
        </div>
        <div className={`size-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      </div>

      {/* Visualizer */}
      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden group">
        <div className="relative flex items-center justify-center">
          <AudioWaveform isActive={isSpeaking} color="#c59f59" />
        </div>

        <div className="text-center z-10 px-4">
          <motion.div
            initial={false}
            animate={{ scale: isSpeaking ? 1.1 : 1 }}
            className="space-y-3"
          >
            <p className={`text-[10px] text-primary font-black uppercase tracking-[0.3em] ${isSpeaking ? "animate-pulse" : ""}`}>
              {isSpeaking ? "Assistant Speaking" : "Listening"}
            </p>
          </motion.div>
          {error && <p className="text-[8px] text-red-500 font-bold uppercase mt-2 tracking-widest">{error}</p>}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleEnd}
        className="w-full py-2.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
      >
        <span className="material-symbols-outlined text-[12px]">power_settings_new</span>
        End Assistant
      </button>
    </div>
  );
}
