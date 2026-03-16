import { motion } from "framer-motion";

interface RoleCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function RoleCard({ title, description, icon, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col p-6 bg-[#161616]/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-[#c59f59]/40 hover:bg-[#1A1A1A]/60 transition-all text-left overflow-hidden w-full h-[220px] justify-between"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#c59f59]/5 blur-[40px] rounded-full group-hover:bg-[#c59f59]/10 transition-all duration-700 -translate-y-8 translate-x-8" />
      <div>
        <div className="w-10 h-10 mb-5 flex items-center justify-center text-[#c59f59] border border-[#c59f59]/20 rounded-sm bg-[#c59f59]/5 group-hover:bg-[#c59f59] group-hover:text-black transition-all">
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <h3 className="text-base font-black text-white mb-1.5 tracking-tight group-hover:text-[#c59f59] transition-colors uppercase leading-tight">
          {title}
        </h3>
        <p className="text-slate-500 text-[10px] leading-relaxed max-w-[180px] font-light">
          {description}
        </p>
      </div>
    </button>
  );
}

interface LoginRoleSelectionProps {
  onSelect: (role: "ADMIN" | "RECRUITER" | "CANDIDATE") => void;
}

export function LoginRoleSelection({ onSelect }: LoginRoleSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-[#c59f59] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>owl</span>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Owlyn</h1>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <RoleCard title="Sign in as Candidate" description="Join a scheduled session or practice your skills in a mock environment." icon="person" onClick={() => onSelect("CANDIDATE")} />
        <RoleCard title="Workspace Team" description="Access the recruiter dash, manage team members and organization settings." icon="business_center" onClick={() => onSelect("RECRUITER")} />
      </div>
    </motion.div>
  );
}
