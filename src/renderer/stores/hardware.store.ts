import { create } from 'zustand'
import type { HardwareCheckResult, DeviceInfo } from '@shared/schemas/hardware.schema'

interface HardwareSlice {
    cameras: DeviceInfo[]
    microphones: DeviceInfo[]
    selectedCamera: string | null
    selectedMic: string | null
    checkResult: HardwareCheckResult | null
    audioLevel: number
    setCameras: (d: DeviceInfo[]) => void
    setMicrophones: (d: DeviceInfo[]) => void
    selectCamera: (id: string) => void
    selectMic: (id: string) => void
    setCheckResult: (r: HardwareCheckResult) => void
    setAudioLevel: (level: number) => void
}

export const useHardwareStore = create<HardwareSlice>((set) => ({
    cameras: [],
    microphones: [],
    selectedCamera: null,
    selectedMic: null,
    checkResult: null,
    audioLevel: 0,
    setCameras: (cameras) => set({ cameras }),
    setMicrophones: (microphones) => set({ microphones }),
    selectCamera: (id) => set({ selectedCamera: id }),
    selectMic: (id) => set({ selectedMic: id }),
    setCheckResult: (checkResult) => set({ checkResult }),
    setAudioLevel: (audioLevel) => set({ audioLevel }),
}))
