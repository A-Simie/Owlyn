const TARGET_FPS = 2
const JPEG_QUALITY = 0.6

export class VideoCaptureService {
    private stream: MediaStream | null = null
    private video: HTMLVideoElement | null = null
    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null
    private intervalId: ReturnType<typeof setInterval> | null = null

    async start(
        deviceId: string | undefined,
        onFrame: (base64: string) => void
    ): Promise<MediaStream> {
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId
                ? { deviceId: { exact: deviceId }, width: 640, height: 480 }
                : { width: 640, height: 480 },
        })

        this.video = document.createElement('video')
        this.video.srcObject = this.stream
        this.video.muted = true
        await this.video.play()

        this.canvas = document.createElement('canvas')
        this.canvas.width = 640
        this.canvas.height = 480
        this.ctx = this.canvas.getContext('2d')

        this.intervalId = setInterval(() => {
            if (!this.video || !this.ctx || !this.canvas) return
            this.ctx.drawImage(this.video, 0, 0, 640, 480)
            const dataUrl = this.canvas.toDataURL('image/jpeg', JPEG_QUALITY)
            const base64 = dataUrl.split(',')[1]
            onFrame(base64)
        }, 1000 / TARGET_FPS)

        return this.stream
    }

    getStream(): MediaStream | null {
        return this.stream
    }

    stop(): void {
        if (this.intervalId) clearInterval(this.intervalId)
        this.video?.pause()
        this.stream?.getTracks().forEach((t) => t.stop())
        this.stream = null
        this.video = null
        this.canvas = null
        this.ctx = null
        this.intervalId = null
    }
}

export const videoCaptureService = new VideoCaptureService()
