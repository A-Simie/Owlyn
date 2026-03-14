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
    setAiSpeaking,
    transcript: transcripts 
  } = useInterviewStore();
  const lastTranscript = transcripts[transcripts.length - 1];
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
        const raw = new TextDecoder().decode(payload);
        
        let msg: any;
        try {
          msg = JSON.parse(raw);
        } catch {
          // Fallback: If it's a raw string, assume it's a transcript from the AI
          if (raw.trim()) {
            addTranscript({
              id: `raw-${Date.now()}`,
              timestamp: new Date().toISOString(),
              speaker: "ai",
              text: raw.trim(),
            });
            setCurrentQuestion(raw.trim());
          }
          return;
        }

        const type = msg.type || msg.event;
        const text = msg.text || msg.content || msg.message || msg.transcript;

        switch (type) {
          case "transcript":
          case "text":
          case "speech":
          case "assistant_message":
            if (text) {
              addTranscript({
                id: msg.id || Date.now().toString(),
                timestamp: new Date().toISOString(),
                speaker: msg.speaker || "ai",
                text: text,
              });
              if (msg.speaker !== "candidate") setCurrentQuestion(text);
            }
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

    const handleTranscription = (transcription: any) => {
      transcription.segments.forEach((segment: any) => {
        if (segment.text.trim()) {
          const isLocal = transcription.participantIdentity === room.localParticipant.identity;
          const text = segment.text.trim();
          addTranscript({
            id: segment.id || `seg-${transcription.participantIdentity}`,
            timestamp: new Date().toISOString(),
            speaker: isLocal ? "candidate" : "ai",
            text: text,
          });
          if (!isLocal) {
            setCurrentQuestion(text);
          }
        }
      });
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);

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
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
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
    <div className="h-screen w-full bg-[#0D0D0D] flex flex-col p-2 space-y-2 overflow-hidden border border-white/5 shadow-2xl rounded-xl">
      {/* Mini Header */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Visualizer & Live Text - More compact */}
        <div className="h-[120px] bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-3 relative overflow-hidden flex-shrink-0 shadow-inner">
          <div className="relative flex items-center justify-center scale-75">
            <AudioWaveform isActive={isSpeaking} color="#c59f59" />
          </div>
          <div className="text-center z-10 px-4">
             <p className={`text-[8px] text-primary font-black uppercase tracking-[0.3em] ${isSpeaking ? "animate-pulse" : ""}`}>
               {isSpeaking ? "Speaking" : "Active"}
             </p>
          </div>
        </div>

        {/* Dedicated Transcript Section */}
        <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col min-h-0 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1 flex-shrink-0">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">History</span>
             <span className="material-symbols-outlined text-slate-600 text-[12px]">history</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
            {transcripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-1">
                <span className="material-symbols-outlined text-xl">forum</span>
                <span className="text-[8px] uppercase font-bold tracking-widest">Dialogue</span>
              </div>
            ) : (
              transcripts.map((t, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={t.id || i} 
                  className="space-y-0.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[7px] font-black uppercase tracking-widest ${t.speaker === "ai" ? "text-primary" : "text-green-500"}`}>
                      {t.speaker === "ai" ? "AI" : "You"}
                    </span>
                    <span className="text-[6px] text-slate-600 font-bold uppercase">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-snug font-medium bg-white/5 p-1.5 rounded-lg border border-white/5">
                    {t.text}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action - Slimmer button */}
      <button
        onClick={handleEnd}
        className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
      >
        <span className="material-symbols-outlined text-[10px]">power_settings_new</span>
        Quit
      </button>
    </div>
  );
}
