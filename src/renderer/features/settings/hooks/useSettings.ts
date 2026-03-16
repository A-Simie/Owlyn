import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { workspaceApi } from "@/api/workspace.api";
import { useAuthStore } from "@/stores/auth.store";
import { extractApiError } from "@/lib/api-error";
import type { WorkspaceMember } from "@shared/schemas/workspace.schema";

export function useSettings() {
  const { user } = useAuthStore();
  const {  setWorkspace } = useWorkspaceStore();
  const isAdmin = user?.role === "ADMIN";

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsUpdating, setWsUpdating] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [tempPasswordMsg, setTempPasswordMsg] = useState<string | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    if (!isAdmin) return;
    setWsLoading(true);
    try {
      const [ws, mems] = await Promise.all([
        workspaceApi.getWorkspace(),
        workspaceApi.getMembers(),
      ]);
      setWorkspace(ws);
      setMembers(mems);
    } catch (error) {
      setWsError(extractApiError(error).message);
    } finally {
      setWsLoading(false);
    }
  }, [isAdmin, setWorkspace]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    setIsInviting(true);
    try {
      const res = await workspaceApi.inviteMember({
        email: inviteEmail,
        fullName: inviteName,
      });
      setTempPasswordMsg(res.message);
      setInviteEmail("");
      setInviteName("");
      const mems = await workspaceApi.getMembers();
      setMembers(mems);
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await workspaceApi.removeMember(userId);
      setMembers(members.filter((m) => m.userId !== userId));
    } catch (error) {
      alert(extractApiError(error).message);
    }
  };

  const handleUpdateWorkspace = async (wsName: string, wsLogoFile: File | null) => {
    setWsUpdating(true);
    try {
      const payload: { name: string; logo?: File } = { name: wsName };
      if (wsLogoFile) payload.logo = wsLogoFile;
      const updated = await workspaceApi.updateWorkspace(payload);
      setWorkspace(updated);
      alert("Workspace updated successfully!");
    } catch (error) {
      alert(extractApiError(error).message);
    } finally {
      setWsUpdating(false);
    }
  };

  return {
    isAdmin,
    members,
    wsLoading,
    wsUpdating,
    wsError,
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
  };
}
