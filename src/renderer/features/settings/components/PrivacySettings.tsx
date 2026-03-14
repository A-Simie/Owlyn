import { useSettingsStore } from "@/stores/settings.store";

export function PrivacySettings() {
  const { autoRecordConsent, dataRetention, setAutoRecordConsent, setDataRetention } = useSettingsStore();

  const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-slate-700"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <section className="mb-10 font-sans">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">shield</span>
        Privacy & Data
      </h2>
      <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl divide-y divide-primary/10">
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-white">Auto-Accept Recording Consent</p>
            <p className="text-xs text-slate-500">Skip the consent prompt before each interview recording</p>
          </div>
          <Toggle on={autoRecordConsent} onChange={setAutoRecordConsent} />
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-white">Data Retention</p>
            <p className="text-xs text-slate-500">How long to keep your interview recordings and transcripts</p>
          </div>
          <select
            value={dataRetention}
            onChange={(e) => setDataRetention(e.target.value as any)}
            className="bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2 px-3 focus:ring-primary focus:border-primary"
          >
            <option value="default">Platform Default</option>
            <option value="30days">30 Days</option>
            <option value="90days">90 Days</option>
            <option value="1year">1 Year</option>
          </select>
        </div>
      </div>
    </section>
  );
}
