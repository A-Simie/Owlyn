interface CheckItemProps {
  label: string;
  status: boolean;
  desc: string;
  icon: string;
  loading?: boolean;
}

function CheckItem({ label, status, desc, icon, loading }: CheckItemProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-sm">
      <div className="flex items-center gap-5">
        <div
          className={`size-12 rounded-sm flex items-center justify-center border transition-all ${status ? "bg-primary/10 border-primary/30 text-primary" : loading ? "bg-white/5 border-white/10 text-slate-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
        >
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-widest">
            {label}
          </p>
          <p className="text-[10px] font-normal text-slate-500 tracking-wide uppercase">
            {desc}
          </p>
        </div>
      </div>
      {status && (
        <span className="material-symbols-outlined text-green-500 text-xl">
          check
        </span>
      )}
    </div>
  );
}

interface HardwareSystemStatusProps {
  checks: {
    camera: boolean;
    mic: boolean;
    network: boolean;
    singleDisplay: boolean;
  };
  isInitializingMedia: boolean;
  networkLatency: number | null;
  isCheckingNetwork: boolean;
  onRefreshNetwork: () => void;
  canProceed: boolean;
  onContinue: () => void;
}

export function HardwareSystemStatus({
  checks,
  isInitializingMedia,
  networkLatency,
  isCheckingNetwork,
  onRefreshNetwork,
  canProceed,
  onContinue,
}: HardwareSystemStatusProps) {
  return (
    <div className="w-full lg:w-[480px] flex flex-col gap-8">
      <div className="bg-[#111] border border-white/5 rounded-sm p-10 flex-1 space-y-12">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            System Diagnostics
          </h3>
          <button
            onClick={onRefreshNetwork}
            disabled={isCheckingNetwork}
            className="size-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-95 disabled:opacity-20"
          >
            <span className={`material-symbols-outlined text-sm ${isCheckingNetwork ? "animate-spin" : ""}`}>
              refresh
            </span>
          </button>
        </div>
        <div className="space-y-3">
          <CheckItem
            label="Webcam"
            status={checks.camera}
            loading={isInitializingMedia}
            desc={isInitializingMedia ? "Initializing..." : checks.camera ? "Operational" : "Check permissions"}
            icon="videocam"
          />
          <CheckItem
            label="Audio"
            status={checks.mic}
            loading={isInitializingMedia}
            desc={isInitializingMedia ? "Initializing..." : checks.mic ? "Operational" : "Check permissions"}
            icon="keyboard_voice"
          />
          {!checks.singleDisplay && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-4">
              <span className="material-symbols-outlined text-red-500">monitor</span>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Multiple Monitors Detected</p>
                <p className="text-[8px] text-red-400/80 uppercase mt-1">Please disconnect extra displays to proceed.</p>
              </div>
            </div>
          )}
          <CheckItem
            label="Network"
            status={checks.network}
            desc={
              isCheckingNetwork
                ? "Pinging..."
                : checks.network
                  ? `${networkLatency}ms latency`
                  : "Network error"
            }
            icon="language"
            loading={isCheckingNetwork}
          />
        </div>
      </div>

      <div className="pt-10 border-t border-white/5">
        <button
          disabled={!canProceed}
          onClick={onContinue}
          className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.4em] text-xs rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 transition-all"
        >
          {canProceed ? "Continue to Lobby" : (
            !checks.singleDisplay ? "Disconnect Monitors" : "Check Diagnostics"
          )}
        </button>
      </div>
    </div>
  );
}
