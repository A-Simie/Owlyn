export class AudioCaptureService {
    private stream: MediaStream | null = null
    private audioContext: AudioContext | null = null
    private processor: ScriptProcessorNode | null = null
    private analyser: AnalyserNode | null = null
    private onAudioData: ((base64: string) => void) | null = null
    private onLevelChange: ((level: number) => void) | null = null

    async start(
        deviceId: string | undefined,
        onAudioData: (base64: string) => void,
        onLevelChange?: (level: number) => void
    ): Promise<void> {
        this.onAudioData = onAudioData
        this.onLevelChange = onLevelChange ?? null

        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        })

        this.audioContext = new AudioContext({ sampleRate: 16000 })
        const source = this.audioContext.createMediaStreamSource(this.stream)

        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 256
        source.connect(this.analyser)

        // ScriptProcessor for raw PCM access
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)
        this.processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0)
            const pcm16 = new Int16Array(input.length)
            for (let i = 0; i < input.length; i++) {
                const s = Math.max(-1, Math.min(1, input[i]))
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
            }
            const bytes = new Uint8Array(pcm16.buffer)
            const base64 = btoa(String.fromCharCode(...bytes))
            this.onAudioData?.(base64)
        }

        source.connect(this.processor)
        this.processor.connect(this.audioContext.destination)

        if (this.onLevelChange) {
            this.pollLevel()
        }
    }

    private pollLevel(): void {
        if (!this.analyser || !this.onLevelChange) return
        const data = new Uint8Array(this.analyser.frequencyBinCount)
        const poll = (): void => {
            if (!this.analyser) return
            this.analyser.getByteFrequencyData(data)
            const avg = data.reduce((sum, v) => sum + v, 0) / data.length
            this.onLevelChange?.(avg / 255)
            requestAnimationFrame(poll)
        }
        poll()
    }

    stop(): void {
        this.processor?.disconnect()
        this.analyser?.disconnect()
        this.audioContext?.close()
        this.stream?.getTracks().forEach((t) => t.stop())
        this.stream = null
        this.audioContext = null
        this.processor = null
        this.analyser = null
    }
}

export const audioCaptureService = new AudioCaptureService()
