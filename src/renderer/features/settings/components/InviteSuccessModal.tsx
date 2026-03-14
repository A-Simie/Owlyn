import { useState } from "react";
import { useClipboard } from "@/hooks/useClipboard";

interface InviteSuccessModalProps {
  message: string;
  onClose: () => void;
}

export function InviteSuccessModal({ message, onClose }: InviteSuccessModalProps) {
  const { copy, hasCopied: justCopied } = useClipboard();
  const password = message.split(":").pop()?.trim() || "";

  const handleCopy = () => {
    copy(password);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="bg-[#0d0d0d] border border-primary/20 w-full max-w-md rounded-2xl shadow-2xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-8 border border-green-500/20 group">
          <span className="material-symbols-outlined text-green-400 text-4xl group-hover:scale-110 transition-transform">check_circle</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Invite Sent!</h3>
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-8">Recruiter successfully added</p>

        <div className="space-y-4 mb-8">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative group overflow-hidden">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] text-center">Temporary Password</span>
              <p className="text-3xl font-bold text-primary font-mono select-all tracking-wider">{password}</p>
            </div>
            <button onClick={handleCopy} className="absolute top-3 right-3 p-2 text-primary/40 hover:text-primary transition-all">
              <span className={`material-symbols-outlined text-lg ${justCopied ? "text-green-500" : ""}`}>{justCopied ? "check_circle" : "content_copy"}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest px-8">Copy the temporary password and send it securely</p>
        </div>

        <button onClick={onClose} className="w-full py-4 bg-primary text-black font-black text-xs uppercase tracking-[0.3em] rounded-lg">Done</button>
      </div>
    </div>
  );
}
