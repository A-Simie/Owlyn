import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settings.store'
import { useMediaStore } from '@/stores/media.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNavigate } from 'react-router-dom'

type DeviceEntry = { deviceId: string; label: string }

export default function SettingsPage() {
    const navigate = useNavigate()
    const { user, clearAuth } = useAuthStore()
    const {
        selectedCameraId, selectedMicId,
        notificationsEnabled, interviewReminders,
        autoRecordConsent, dataRetention,
        setSelectedCameraId, setSelectedMicId,
        setNotificationsEnabled, setInterviewReminders,
        setAutoRecordConsent, setDataRetention,
    } = useSettingsStore()

    const { cameraOn, micOn, startCamera, stopCamera, startMic, stopMic } = useMediaStore()

    const [cameras, setCameras] = useState<DeviceEntry[]>([])
    const [mics, setMics] = useState<DeviceEntry[]>([])

    const enumerateDevices = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => s.getTracks().forEach((t) => t.stop()))
            const devices = await navigator.mediaDevices.enumerateDevices()
            setCameras(devices.filter((d) => d.kind === 'videoinput').map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 6)}` })))
            setMics(devices.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 6)}` })))
        } catch {
            // permission denied
        }
    }, [])

    useEffect(() => { enumerateDevices() }, [enumerateDevices])

    const handleCameraToggle = useCallback(async (on: boolean) => {
        if (on) await startCamera(selectedCameraId ?? undefined)
        else stopCamera()
    }, [startCamera, stopCamera, selectedCameraId])

    const handleMicToggle = useCallback(async (on: boolean) => {
        if (on) await startMic(selectedMicId ?? undefined)
        else stopMic()
    }, [startMic, stopMic, selectedMicId])

    const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
        <button onClick={() => onChange(!on)} className={`w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-primary' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
    )

    return (
        <div className="min-h-screen p-8 lg:p-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
            <p className="text-slate-500 text-sm mb-10">Manage your device preferences, notifications, and privacy.</p>

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
                                <span className="material-symbols-outlined text-primary">videocam</span>
                                <div>
                                    <p className="text-sm font-semibold text-white">Camera</p>
                                    <p className="text-xs text-slate-500">Enable camera for interviews</p>
                                </div>
                            </div>
                            <Toggle on={cameraOn} onChange={handleCameraToggle} />
                        </div>
                        {cameraOn && (
                            <select
                                value={selectedCameraId || ''}
                                onChange={(e) => setSelectedCameraId(e.target.value || null)}
                                className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2.5 px-4 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Default Camera</option>
                                {cameras.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Mic */}
                    <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">mic</span>
                                <div>
                                    <p className="text-sm font-semibold text-white">Microphone</p>
                                    <p className="text-xs text-slate-500">Enable microphone for interviews</p>
                                </div>
                            </div>
                            <Toggle on={micOn} onChange={handleMicToggle} />
                        </div>
                        {micOn && (
                            <select
                                value={selectedMicId || ''}
                                onChange={(e) => setSelectedMicId(e.target.value || null)}
                                className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white text-sm py-2.5 px-4 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Default Microphone</option>
                                {mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="mb-10">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">notifications</span>
                    Notifications
                </h2>
                <div className="bg-[#0d0d0d] border border-primary/15 rounded-xl divide-y divide-primary/10">
                    <div className="flex items-center justify-between p-5">
                        <div>
                            <p className="text-sm font-semibold text-white">Email Notifications</p>
                            <p className="text-xs text-slate-500">Receive updates about interview results and feedback</p>
                        </div>
                        <Toggle on={notificationsEnabled} onChange={setNotificationsEnabled} />
                    </div>
                    <div className="flex items-center justify-between p-5">
                        <div>
                            <p className="text-sm font-semibold text-white">Interview Reminders</p>
                            <p className="text-xs text-slate-500">Get notified 15 minutes before scheduled interviews</p>
                        </div>
                        <Toggle on={interviewReminders} onChange={setInterviewReminders} />
                    </div>
                </div>
            </section>

            {/* Privacy */}
            <section className="mb-10">
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
                            onChange={(e) => setDataRetention(e.target.value as 'default' | '30days' | '90days' | '1year')}
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
                            <span className="material-symbols-outlined text-primary text-2xl">person</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{user?.email || 'user@owlyn.ai'}</p>
                            <p className="text-xs text-slate-500">Enterprise Plan</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-primary/10 flex gap-3">
                        <button
                            onClick={() => { clearAuth(); navigate('/auth') }}
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
                            <p className="text-xs text-slate-500">v1.0.0 · Aion AI Core v4.0</p>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                            <a className="hover:text-primary transition-colors" href="#">Changelog</a>
                            <a className="hover:text-primary transition-colors" href="#">Licenses</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
