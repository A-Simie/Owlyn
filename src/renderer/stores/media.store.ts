import { create } from 'zustand'

interface MediaState {
    cameraStream: MediaStream | null
    micStream: MediaStream | null
    cameraOn: boolean
    micOn: boolean
    audioLevel: number
    cameraError: string | null
    micError: string | null

    startCamera: (deviceId?: string) => Promise<void>
    stopCamera: () => void
    startMic: (deviceId?: string) => Promise<void>
    stopMic: () => void
    setAudioLevel: (level: number) => void
    stopAll: () => void
}

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animFrameId = 0

export const useMediaStore = create<MediaState>((set, get) => ({
    cameraStream: null,
    micStream: null,
    cameraOn: false,
    micOn: false,
    audioLevel: 0,
    cameraError: null,
    micError: null,

    startCamera: async (deviceId) => {
        const { cameraOn, stopCamera } = get()
        if (cameraOn) stopCamera()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
            })
            set({ cameraStream: stream, cameraOn: true, cameraError: null })
        } catch (err) {
            set({ cameraError: err instanceof Error ? err.message : 'Camera access denied' })
        }
    },

    stopCamera: () => {
        const { cameraStream } = get()
        cameraStream?.getVideoTracks().forEach((t) => t.stop())
        set({ cameraStream: null, cameraOn: false })
    },

    startMic: async (deviceId) => {
        const { micOn, stopMic } = get()
        if (micOn) stopMic()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
            })

            audioCtx = new AudioContext()
            const source = audioCtx.createMediaStreamSource(stream)
            analyser = audioCtx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            const data = new Uint8Array(analyser.frequencyBinCount)

            const poll = () => {
                if (!analyser) return
                analyser.getByteFrequencyData(data)
                const avg = data.reduce((s, v) => s + v, 0) / data.length
                set({ audioLevel: avg / 255 })
                animFrameId = requestAnimationFrame(poll)
            }
            poll()

            set({ micStream: stream, micOn: true, micError: null })
        } catch (err) {
            set({ micError: err instanceof Error ? err.message : 'Microphone access denied' })
        }
    },

    stopMic: () => {
        cancelAnimationFrame(animFrameId)
        const { micStream } = get()
        micStream?.getAudioTracks().forEach((t) => t.stop())
        if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close()
        }
        audioCtx = null
        analyser = null
        set({ micStream: null, micOn: false, audioLevel: 0 })
    },

    setAudioLevel: (audioLevel) => set({ audioLevel }),

    stopAll: () => {
        get().stopCamera()
        get().stopMic()
    },
}))
