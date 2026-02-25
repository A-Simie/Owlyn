export class AudioPlaybackService {
    private audioContext: AudioContext | null = null
    private nextStartTime = 0

    init(): void {
        if (!this.audioContext) {
            this.audioContext = new AudioContext({ sampleRate: 24000 })
            this.nextStartTime = this.audioContext.currentTime
        }
    }

    playBase64Chunk(base64: string): void {
        if (!this.audioContext) this.init()
        const ctx = this.audioContext!

        const binaryStr = atob(base64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
        }

        const pcm16 = new Int16Array(bytes.buffer)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000)
        audioBuffer.getChannelData(0).set(float32)

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)

        const now = ctx.currentTime
        if (this.nextStartTime < now) {
            this.nextStartTime = now
        }
        source.start(this.nextStartTime)
        this.nextStartTime += audioBuffer.duration
    }

    stop(): void {
        this.audioContext?.close()
        this.audioContext = null
        this.nextStartTime = 0
    }
}

export const audioPlaybackService = new AudioPlaybackService()
