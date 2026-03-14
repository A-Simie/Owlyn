import { motion } from "framer-motion";
import OtpInput from "./OtpInput";

interface OtpVerificationProps {
  onBack: () => void;
  onVerify: (code: string) => void;
  onResend: () => void;
  email: string;
  loading: boolean;
  error: string | null;
}

export function OtpVerification({
  onBack,
  onVerify,
  onResend,
  email,
  loading,
  error,
}: OtpVerificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#111] p-10 rounded-lg shadow-2xl space-y-10 border border-white/5"
    >
      <div className="flex flex-col items-center space-y-8 text-center">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Use different email
        </button>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c59f59]/10 mb-2 border border-[#c59f59]/20">
          <span
            className="material-symbols-outlined text-[#c59f59] text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            owl
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">
            Security Check
          </h2>
          <p className="text-slate-500 text-sm font-light leading-relaxed">
            Verification code sent to
            <br />
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <OtpInput onComplete={onVerify} disabled={loading} />
        {error && (
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
            {error}
          </p>
        )}
        <div className="text-center">
          <button
            disabled={loading}
            onClick={onResend}
            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-[#c59f59] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Resend Code
          </button>
        </div>
      </div>
    </motion.div>
  );
}
