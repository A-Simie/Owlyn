import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { useMediaStore } from "@/stores/media.store";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import { workspaceApi } from "@/api/workspace.api";
import type {
  Workspace,
  WorkspaceMember,
} from "@shared/schemas/workspace.schema";
import { extractApiError } from "@/lib/api-error";

type DeviceEntry = { deviceId: string; label: string };

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [tempPasswordMsg, setTempPasswordMsg] = useState<string | null>(null);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const {
    selectedCameraId,
    selectedMicId,
    notificationsEnabled,
    interviewReminders,
    autoRecordConsent,
    dataRetention,
    setSelectedCameraId,
    setSelectedMicId,
    setNotificationsEnabled,
    setInterviewReminders,
    setAutoRecordConsent,
    setDataRetention,
  } = useSettingsStore();

  const { cameraOn, micOn, startCamera, stopCamera, startMic, stopMic } =
    useMediaStore();

  const [cameras, setCameras] = useState<DeviceEntry[]>([]);
  const [mics, setMics] = useState<DeviceEntry[]>([]);

  const enumerateDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => s.getTracks().forEach((t) => t.stop()));
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(
        devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
          })),
      );
      setMics(
        devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Mic ${d.deviceId.slice(0, 6)}`,
          })),
      );
    } catch {
      // permission denied
    }
  }, []);

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
  }, [isAdmin]);

  useEffect(() => {
    enumerateDevices();
    fetchWorkspaceData();
  }, [enumerateDevices, fetchWorkspaceData]);

  const handleCameraToggle = useCallback(
    async (on: boolean) => {
      if (on) await startCamera(selectedCameraId ?? undefined);
      else stopCamera();
    },
    [startCamera, stopCamera, selectedCameraId],
  );

  const handleMicToggle = useCallback(
    async (on: boolean) => {
      if (on) await startMic(selectedMicId ?? undefined);
      else stopMic();
    },
    [startMic, stopMic, selectedMicId],
  );

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

  const handleUpdateWorkspace = async (
    updates: Partial<Pick<Workspace, "name" | "logoUrl">>,
  ) => {
    try {
      const updated = await workspaceApi.updateWorkspace(updates);
      setWorkspace(updated);
    } catch (error) {
      alert(extractApiError(error).message);
    }
  };

  const Toggle = ({
    on,
    onChange,
  }: {
    on: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-slate-700"}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );

  return (
    <div className="min-h-screen p-8 lg:p-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-10">
        Manage your device preferences, notifications, and privacy.
      </p>

      {/* Device Controls */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">devices</span>
          Device Controls
        </h2>
        <div className="space-y-4">
          {/* Camera */}
          <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  videocam
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Camera</p>
                  <p className="text-xs text-slate-500">
                    Enable camera for interviews
                  </p>
                </div>
              </div>
              <Toggle on={cameraOn} onChange={handleCameraToggle} />
            </div>
            {cameraOn && (
              <select
                value={selectedCameraId || ""}
                onChange={(e) => setSelectedCameraId(e.target.value || null)}
                className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2.5 px-4 focus:ring-primary focus:border-primary"
              >
                <option value="">Default Camera</option>
                {cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mic */}
          <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  mic
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Microphone</p>
                  <p className="text-xs text-slate-500">
                    Enable microphone for interviews
                  </p>
                </div>
              </div>
              <Toggle on={micOn} onChange={handleMicToggle} />
            </div>
            {micOn && (
              <select
                value={selectedMicId || ""}
                onChange={(e) => setSelectedMicId(e.target.value || null)}
                className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2.5 px-4 focus:ring-primary focus:border-primary"
              >
                <option value="">Default Microphone</option>
                {mics.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">
            notifications
          </span>
          Notifications
        </h2>
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl divide-y divide-primary/10">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-semibold text-white">
                Email Notifications
              </p>
              <p className="text-xs text-slate-500">
                Receive updates about interview results and feedback
              </p>
            </div>
            <Toggle
              on={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-semibold text-white">
                Interview Reminders
              </p>
              <p className="text-xs text-slate-500">
                Get notified 15 minutes before scheduled interviews
              </p>
            </div>
            <Toggle on={interviewReminders} onChange={setInterviewReminders} />
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">owl</span>
            Workspace Management
          </h2>
          <div className="space-y-6">
            {/* Profile */}
            <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Workspace Profile
              </h3>
              <div className="flex gap-6 items-center">
                <div className="size-20 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  {workspace?.logoUrl ? (
                    <img
                      src={workspace.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-primary/40 text-4xl">
                      image
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      defaultValue={workspace?.name}
                      onBlur={(e) =>
                        handleUpdateWorkspace({ name: e.target.value })
                      }
                      className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2 px-4 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      defaultValue={workspace?.logoUrl}
                      onBlur={(e) =>
                        handleUpdateWorkspace({ logoUrl: e.target.value })
                      }
                      className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2 px-4 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Team Members
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage who has access to this workspace
                  </p>
                </div>
              </div>
              <div className="divide-y divide-primary/5">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-xs">
                          {m.fullName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {m.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                          {m.email} • {m.role}
                        </p>
                      </div>
                    </div>
                    {m.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove Member"
                      >
                        <span className="material-symbols-outlined text-lg">
                          person_remove
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-6 bg-primary/5 border-t border-primary/10">
                <form onSubmit={handleInvite} className="flex gap-3">
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
                    {isInviting && (
                      <div className="size-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    )}
                    Invite
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Privacy */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">shield</span>
          Privacy & Data
        </h2>
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl divide-y divide-primary/10">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-semibold text-white">
                Auto-Accept Recording Consent
              </p>
              <p className="text-xs text-slate-500">
                Skip the consent prompt before each interview recording
              </p>
            </div>
            <Toggle on={autoRecordConsent} onChange={setAutoRecordConsent} />
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-semibold text-white">Data Retention</p>
              <p className="text-xs text-slate-500">
                How long to keep your interview recordings and transcripts
              </p>
            </div>
            <select
              value={dataRetention}
              onChange={(e) =>
                setDataRetention(
                  e.target.value as "default" | "30days" | "90days" | "1year",
                )
              }
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

      {/* Account */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">person</span>
          Account
        </h2>
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                person
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {user?.email || "user@owlyn.ai"}
              </p>
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

      {/* About */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          About
        </h2>
        <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Owlyn Desktop</p>
              <p className="text-xs text-slate-500">
                v1.0.0 · Aion AI Core v4.0
              </p>
            </div>
            <div className="flex gap-4 text-xs text-slate-500">
              <a className="hover:text-primary transition-colors" href="#">
                Changelog
              </a>
              <a className="hover:text-primary transition-colors" href="#">
                Licenses
              </a>
            </div>
          </div>
        </div>
      </section>

      {tempPasswordMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-primary/20 w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6 border border-green-500/20">
              <span className="material-symbols-outlined text-green-400 text-3xl">
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Invite Sent!</h3>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 relative group/pass">
              <p className="text-sm text-slate-300 font-mono break-all select-all pr-10">
                {tempPasswordMsg}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPasswordMsg || "");
                  alert("Password copied to clipboard!");
                }}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-primary/40 hover:text-primary transition-colors"
                title="Copy to clipboard"
              >
                <span className="material-symbols-outlined text-sm">
                  content_copy
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Copy the temporary password above and send it to the recruiter so
              they can log in.
            </p>
            <button
              onClick={() => setTempPasswordMsg(null)}
              className="w-full py-3 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
