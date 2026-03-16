import { useLobby } from "./hooks/useLobby";
import { SessionSummary } from "./components/SessionSummary";

export default function LobbyPage() {
  const { isStarting, error, handleStart } = useLobby();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-100 flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      <main className="w-full max-w-xl z-10 space-y-10">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">
            Session Details
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Review the information below before starting.
          </p>
        </header>

        <div className="space-y-6">
          <SessionSummary />

          <div className="pt-4 space-y-4">
            {error && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center animate-pulse">
                {error}
              </p>
            )}
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.4em] text-xs rounded-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Enter Interview
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
