import { create } from 'zustand'

interface SettingsState {
    selectedCameraId: string | null
    selectedMicId: string | null
    notificationsEnabled: boolean
    interviewReminders: boolean
    autoRecordConsent: boolean
    dataRetention: 'default' | '30days' | '90days' | '1year'

    setSelectedCameraId: (id: string | null) => void
    setSelectedMicId: (id: string | null) => void
    setNotificationsEnabled: (v: boolean) => void
    setInterviewReminders: (v: boolean) => void
    setAutoRecordConsent: (v: boolean) => void
    setDataRetention: (v: SettingsState['dataRetention']) => void
}

function loadPersisted<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(`owlyn-settings-${key}`)
        return raw !== null ? JSON.parse(raw) : fallback
    } catch {
        return fallback
    }
}

function persist(key: string, value: unknown) {
    try { localStorage.setItem(`owlyn-settings-${key}`, JSON.stringify(value)) } catch { /* noop */ }
}

export const useSettingsStore = create<SettingsState>((set) => ({
    selectedCameraId: loadPersisted('selectedCameraId', null),
    selectedMicId: loadPersisted('selectedMicId', null),
    notificationsEnabled: loadPersisted('notificationsEnabled', true),
    interviewReminders: loadPersisted('interviewReminders', true),
    autoRecordConsent: loadPersisted('autoRecordConsent', false),
    dataRetention: loadPersisted('dataRetention', 'default'),

    setSelectedCameraId: (id) => { persist('selectedCameraId', id); set({ selectedCameraId: id }) },
    setSelectedMicId: (id) => { persist('selectedMicId', id); set({ selectedMicId: id }) },
    setNotificationsEnabled: (v) => { persist('notificationsEnabled', v); set({ notificationsEnabled: v }) },
    setInterviewReminders: (v) => { persist('interviewReminders', v); set({ interviewReminders: v }) },
    setAutoRecordConsent: (v) => { persist('autoRecordConsent', v); set({ autoRecordConsent: v }) },
    setDataRetention: (v) => { persist('dataRetention', v); set({ dataRetention: v }) },
}))
