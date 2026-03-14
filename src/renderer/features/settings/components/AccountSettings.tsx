import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function AccountSettings() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  return (
    <section className="mb-10 font-sans">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">person</span>
        Account
      </h2>
      <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">person</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.email || "user@owlyn.ai"}</p>
            <p className="text-xs text-slate-500">Enterprise Plan</p>
          </div>
        </div>
        <div className="pt-4 border-t border-primary/10 flex gap-3">
          <button
            onClick={() => {
              clearAuth();
              navigate("/auth");
            }}
            className="px-5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section className="font-sans">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">info</span>
        About
      </h2>
      <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Owlyn Desktop</p>
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <a className="hover:text-primary transition-colors cursor-pointer">Changelog</a>
            <a className="hover:text-primary transition-colors cursor-pointer">Licenses</a>
          </div>
        </div>
      </div>
    </section>
  );
}
