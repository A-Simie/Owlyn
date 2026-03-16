import { motion, AnimatePresence } from "framer-motion";

interface MonitoringSentinelAlertsProps {
  alerts: any[];
}

export function MonitoringSentinelAlerts({ alerts }: MonitoringSentinelAlertsProps) {
  return (
    <div className="flex-1 bg-[#121212] border border-white/5 rounded-lg flex flex-col overflow-hidden">
      <header className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Sentinel Alerts</h3>
        {alerts.length > 0 && <span className="size-2 bg-red-500 rounded-full animate-bounce" />}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 border border-red-500/20 bg-red-500/5 rounded-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Security Alert</span>
                  <span className="text-[8px] font-mono opacity-40">{alert.time}</span>
                </div>
                <p className="text-[10px] font-medium text-slate-300">{alert.message}</p>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <span className="material-symbols-outlined text-4xl mb-2">shield_check</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">No anomalies detected</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
