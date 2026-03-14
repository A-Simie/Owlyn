import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface AccessCodeEntryProps {
  onBack: () => void;
  onValidate: (code: string) => void;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function AccessCodeEntry({ onBack, onValidate, loading, error, success }: AccessCodeEntryProps) {
  return (
    <motion.div
      key="interview-code"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#111] p-10 rounded-lg shadow-2xl space-y-12 border border-white/5"
    >
      <div className="flex flex-col items-center space-y-8">
        <button onClick={onBack} className="group inline-flex items-center gap-2 text-slate-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Change mode
        </button>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c59f59]/10 mb-2 border border-[#c59f59]/20">
          <span className="material-symbols-outlined text-[#c59f59] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight uppercase">
          {success ? "Code Verified" : "Access Code"}
        </h2>
      </div>

      <div className="space-y-6">
        {success ? (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="size-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 animate-pulse">check_circle</span>
            </div>
            <p className="text-sm text-slate-400 animate-pulse">Redirecting to lobby...</p>
          </div>
        ) : (
          <>
            <CodeInput onComplete={onValidate} disabled={loading} error={!!error} />
            {loading && (
              <div className="flex justify-center mt-4">
                <div className="size-5 border-2 border-[#c59f59]/30 border-t-[#c59f59] rounded-full animate-spin" />
              </div>
            )}
            {error && (
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1.5 mt-4">
                <span className="material-symbols-outlined text-xs">error</span>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function CodeInput({ onComplete, disabled, error }: { onComplete: (code: string) => void; disabled?: boolean; error?: boolean }) {
  const [values, setValues] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (newValues.every((v) => v !== "")) onComplete(newValues.join(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(data)) return;
    const digits = data.slice(0, 6).split("");
    const newValues = [...values];
    digits.forEach((digit, i) => { newValues[i] = digit; });
    setValues(newValues);
    const nextIndex = Math.min(digits.length, 5);
    inputs.current[nextIndex]?.focus();
    if (digits.length === 6) onComplete(digits.join(""));
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={`w-14 h-20 bg-[#161616] border ${error ? "border-red-500/50" : "border-white/5"} rounded-sm text-center text-3xl font-bold text-[#c59f59] focus:border-[#c59f59]/50 outline-none transition-all`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
