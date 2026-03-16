import { useWorkspaceStore } from "@/stores/workspace.store";
import { useAuthStore } from "@/stores/auth.store";
import { useSettings } from "./hooks/useSettings";
import { WorkspaceProfile } from "./components/WorkspaceProfile";
import { TeamManagement } from "./components/TeamManagement";
import { PrivacySettings } from "./components/PrivacySettings";
import { AccountSettings, AboutSection } from "./components/AccountSettings";
import { InviteSuccessModal } from "./components/InviteSuccessModal";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { workspace } = useWorkspaceStore();
  
  const {
    isAdmin,
    members,
    wsUpdating,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    isInviting,
    tempPasswordMsg,
    setTempPasswordMsg,
    handleInvite,
    handleRemoveMember,
    handleUpdateWorkspace,
  } = useSettings();

  return (
    <div className="min-h-screen p-8 lg:p-12 max-w-4xl font-sans">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>   
      
      {isAdmin && (
        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">owl</span>
            Workspace Management
          </h2>
          <div className="space-y-6">
            <WorkspaceProfile 
              workspace={workspace} 
              onUpdate={handleUpdateWorkspace} 
              updating={wsUpdating} 
            />
            <TeamManagement 
              members={members} 
              onRemove={handleRemoveMember} 
              onInvite={handleInvite} 
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              inviteName={inviteName}
              setInviteName={setInviteName}
              isInviting={isInviting}
              currentUserId={user?.id}
            />
          </div>
        </section>
      )}

      <PrivacySettings />
      <AccountSettings />
      <AboutSection />

      {tempPasswordMsg && (
        <InviteSuccessModal 
          message={tempPasswordMsg} 
          onClose={() => setTempPasswordMsg(null)} 
        />
      )}
    </div>
  );
}
