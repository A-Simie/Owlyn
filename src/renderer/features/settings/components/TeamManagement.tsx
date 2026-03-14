import type { WorkspaceMember } from "@shared/schemas/workspace.schema";

interface TeamManagementProps {
  members: WorkspaceMember[];
  onRemove: (userId: string) => Promise<void>;
  onInvite: (e: React.FormEvent) => Promise<void>;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteName: string;
  setInviteName: (v: string) => void;
  isInviting: boolean;
  currentUserId?: string;
}

export function TeamManagement({ 
  members, onRemove, onInvite, inviteEmail, setInviteEmail, inviteName, setInviteName, isInviting, currentUserId 
}: TeamManagementProps) {
  return (
    <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl overflow-hidden font-sans">
      <div className="p-6 border-b border-primary/10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Team Members</h3>
          <p className="text-xs text-slate-500">Manage who has access to this workspace</p>
        </div>
      </div>
      <div className="divide-y divide-primary/5">
        {members.map((m) => (
          <div key={m.userId} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">{m.fullName[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{m.fullName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{m.email} • {m.role}</p>
              </div>
            </div>
            {m.userId !== currentUserId && (
              <button onClick={() => onRemove(m.userId)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined text-lg">person_remove</span>
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="p-6 bg-primary/5 border-t border-primary/10">
        <form onSubmit={onInvite} className="flex gap-3">
          <input
            type="text"
            placeholder="Recruiter name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            className="w-40 bg-[#0d0d0d] border border-primary/20 rounded-lg text-white text-sm py-2 px-4 focus:ring-primary focus:border-primary"
          />
          <input
            type="email"
            placeholder="recruiter@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 bg-[#0d0d0d] border border-primary/20 rounded-lg text-white text-sm py-2 px-4 focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            disabled={isInviting || !inviteEmail || !inviteName}
            className="px-6 py-2 bg-primary text-black font-bold text-[10px] uppercase tracking-widest rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isInviting && <div className="size-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            Invite
          </button>
        </form>
      </div>
    </div>
  );
}
