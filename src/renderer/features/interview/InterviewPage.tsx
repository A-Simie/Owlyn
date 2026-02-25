import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/session.store'
import { useInterviewStore } from '@/stores/interview.store'
import { useMediaStore } from '@/stores/media.store'
import { wsService } from '@/services/ws.service'
import { audioPlaybackService } from '@/services/playback.service'

export default function InterviewPage() {
    const navigate = useNavigate()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const trackingFrameRef = useRef(0)
    const { elapsedSeconds, tick } = useSessionStore()
    const { transcript, currentQuestion, setCurrentQuestion, addTranscript } = useInterviewStore()
    const { cameraOn, micOn, cameraStream, startCamera, startMic, stopCamera, stopMic, stopAll } = useMediaStore()
    const [isConnected, setIsConnected] = useState(false)

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600).toString().padStart(2, '0')
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
        const sec = (s % 60).toString().padStart(2, '0')
        return `${h}:${m}:${sec}`
    }

    const handleEndSession = useCallback(() => {
        wsService.disconnect()
        audioPlaybackService.stop()
        cancelAnimationFrame(trackingFrameRef.current)
        stopAll()
        navigate('/analysis')
    }, [navigate, stopAll])

    const toggleCamera = useCallback(async () => {
        if (cameraOn) stopCamera()
        else await startCamera()
    }, [cameraOn, stopCamera, startCamera])

    const toggleMic = useCallback(async () => {
        if (micOn) stopMic()
        else await startMic()
    }, [micOn, stopMic, startMic])

    // Sync video element with camera stream
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = cameraStream
            if (cameraStream) videoRef.current.play().catch(() => { })
        }
    }, [cameraStream])

    // Face tracking overlay
    useEffect(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || !cameraOn) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Smoothed state in video-pixel coordinates
        let rawFx = 0, rawFy = 0, rawFw = 0, rawFh = 0
        let rawElx = 0, rawEly = 0, rawErx = 0, rawEry = 0
        let rawNx = 0, rawNy = 0
        let hasFace = false
        let initialized = false
        const spd = 0.3

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FD = (window as any).FaceDetector
        const detector = FD ? new FD({ fastMode: true, maxDetectedFaces: 1 }) : null
        let detectId: ReturnType<typeof setInterval> | null = null

        const detect = async () => {
            if (!video || video.readyState < 2 || !detector) return
            try {
                const faces = await detector.detect(video)
                if (faces.length > 0) {
                    const f = faces[0]
                    const bb = f.boundingBox
                    const cfx = bb.x + bb.width / 2
                    const cfy = bb.y + bb.height / 2
                    // Use bounding box dimensions directly — the ellipse will
                    // naturally match the face shape (wide for chubby, narrow for slim)
                    const cfw = bb.width * 1.3
                    const cfh = bb.height * 1.4

                    if (!initialized) {
                        rawFx = cfx; rawFy = cfy; rawFw = cfw; rawFh = cfh
                        initialized = true
                    } else {
                        rawFx += (cfx - rawFx) * spd
                        rawFy += (cfy - rawFy) * spd
                        rawFw += (cfw - rawFw) * spd
                        rawFh += (cfh - rawFh) * spd
                    }
                    hasFace = true

                    // Collect eye + nose landmarks
                    // FaceDetector returns SEPARATE 'eye' entries (one per eye)
                    // each with a single location, NOT one entry with 2 locations
                    const eyes: { x: number; y: number }[] = []
                    let noseFound = false
                    if (f.landmarks) {
                        for (const lm of f.landmarks) {
                            if (lm.type === 'eye') {
                                for (const loc of lm.locations) {
                                    eyes.push({ x: loc.x, y: loc.y })
                                }
                            }
                            if (lm.type === 'nose' && lm.locations.length >= 1) {
                                rawNx += (lm.locations[0].x - rawNx) * spd
                                rawNy += (lm.locations[0].y - rawNy) * spd
                                noseFound = true
                            }
                        }
                    }

                    if (eyes.length >= 2) {
                        // Sort by x to determine left vs right
                        eyes.sort((a, b) => a.x - b.x)
                        rawElx += (eyes[0].x - rawElx) * spd
                        rawEly += (eyes[0].y - rawEly) * spd
                        rawErx += (eyes[1].x - rawErx) * spd
                        rawEry += (eyes[1].y - rawEry) * spd
                    } else {
                        // Fallback: estimate from bounding box
                        rawElx += ((bb.x + bb.width * 0.3) - rawElx) * spd
                        rawEly += ((bb.y + bb.height * 0.35) - rawEly) * spd
                        rawErx += ((bb.x + bb.width * 0.7) - rawErx) * spd
                        rawEry += ((bb.y + bb.height * 0.35) - rawEry) * spd
                    }
                    if (!noseFound) {
                        rawNx += ((bb.x + bb.width * 0.5) - rawNx) * spd
                        rawNy += ((bb.y + bb.height * 0.6) - rawNy) * spd
                    }
                } else {
                    hasFace = false
                }
            } catch { /* skip */ }
        }

        if (detector) detectId = setInterval(detect, 80)

        // object-cover transform: video coords → canvas coords
        const mapToCanvas = (vx: number, vy: number, cw: number, ch: number) => {
            const vw = video.videoWidth || 640
            const vh = video.videoHeight || 480
            const videoAspect = vw / vh
            const canvasAspect = cw / ch
            let scale: number, offsetX: number, offsetY: number
            if (canvasAspect < videoAspect) {
                scale = ch / vh
                offsetX = (cw - vw * scale) / 2
                offsetY = 0
            } else {
                scale = cw / vw
                offsetX = 0
                offsetY = (ch - vh * scale) / 2
            }
            return { x: vx * scale + offsetX, y: vy * scale + offsetY, scale }
        }

        const draw = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)

            if (!hasFace && !detector) {
                const vw = video.videoWidth || 640
                const vh = video.videoHeight || 480
                rawFx = vw * 0.5 + Math.sin(Date.now() / 5000) * vw * 0.02
                rawFy = vh * 0.4; rawFw = vw * 0.25; rawFh = vh * 0.35
                rawElx = vw * 0.44; rawEly = vh * 0.35
                rawErx = vw * 0.56; rawEry = vh * 0.35
                rawNx = vw * 0.5; rawNy = vh * 0.45
                hasFace = true
            }

            if (!hasFace) {
                ctx.fillStyle = 'rgba(197, 159, 89, 0.5)'
                ctx.font = 'bold 11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText('SCANNING FOR FACE...', w / 2, h / 2)
                trackingFrameRef.current = requestAnimationFrame(draw)
                return
            }

            const fc = mapToCanvas(rawFx, rawFy, w, h)
            const { scale } = fc
            const rw = rawFw * scale / 2
            const rh = rawFh * scale / 2
            const cx = fc.x
            const cy = fc.y
            const el = mapToCanvas(rawElx, rawEly, w, h)
            const er = mapToCanvas(rawErx, rawEry, w, h)
            const ns = mapToCanvas(rawNx, rawNy, w, h)

            // Face oval
            ctx.strokeStyle = '#c59f59'
            ctx.lineWidth = 1.5
            ctx.setLineDash([5, 4])
            ctx.beginPath()
            ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])

            // Corner brackets at 45° on the oval
            ctx.strokeStyle = '#c59f59'
            ctx.lineWidth = 2.5
            const bl = 16
            for (const a of [-Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4]) {
                const px = cx + Math.cos(a) * rw
                const py = cy + Math.sin(a) * rh
                const tx = Math.cos(a)
                const ty = Math.sin(a)
                const tanX = -Math.sin(a) * (rw / rh)
                const tanY = Math.cos(a) * (rh / rw)
                const tanLen = Math.sqrt(tanX * tanX + tanY * tanY)
                const ntx = tanX / tanLen
                const nty = tanY / tanLen
                ctx.beginPath()
                ctx.moveTo(px - ntx * bl, py - nty * bl)
                ctx.lineTo(px, py)
                ctx.lineTo(px + tx * bl * 0.5, py + ty * bl * 0.5)
                ctx.stroke()
            }

            // Eye dots
            ctx.fillStyle = '#c59f59'
            ctx.shadowColor = '#c59f59'
            ctx.shadowBlur = 14
            ctx.beginPath(); ctx.arc(el.x, el.y, 5, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(er.x, er.y, 5, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            // Eye rings
            ctx.strokeStyle = '#c59f59'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.arc(el.x, el.y, 10, 0, Math.PI * 2); ctx.stroke()
            ctx.beginPath(); ctx.arc(er.x, er.y, 10, 0, Math.PI * 2); ctx.stroke()

            // Eye connecting line
            ctx.strokeStyle = 'rgba(197, 159, 89, 0.3)'
            ctx.setLineDash([3, 3])
            ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(er.x, er.y); ctx.stroke()
            ctx.setLineDash([])

            // Gaze triangle
            ctx.strokeStyle = 'rgba(197, 159, 89, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(ns.x, ns.y); ctx.lineTo(er.x, er.y); ctx.stroke()

            // Nose dot
            ctx.fillStyle = 'rgba(197,159,89,0.4)'
            ctx.beginPath(); ctx.arc(ns.x, ns.y, 3, 0, Math.PI * 2); ctx.fill()

            // Labels
            ctx.fillStyle = '#c59f59'
            ctx.font = 'bold 9px monospace'
            ctx.textAlign = 'left'
            ctx.fillText('FACE DETECTED', cx - rw, cy - rh - 10)
            ctx.fillText('EYE TRACKING: LOCKED', er.x + 16, (el.y + er.y) / 2)

            trackingFrameRef.current = requestAnimationFrame(draw)
        }

        draw()
        return () => {
            cancelAnimationFrame(trackingFrameRef.current)
            if (detectId) clearInterval(detectId)
        }
    }, [cameraOn])

    useEffect(() => {
        const sessionId = `OWL-${Date.now()}`
        const timer = setInterval(tick, 1000)

        setCurrentQuestion(
            'Tell me about your experience with architectural scalability in distributed systems.'
        )
        addTranscript({
            id: '1', timestamp: '00:00:05', speaker: 'ai',
            text: 'Thinking specifically about the CAP theorem, how have you handled eventual consistency in your previous high-load projects?',
        })
        addTranscript({
            id: '2', timestamp: '00:01:30', speaker: 'candidate',
            text: 'In my last role at TechCorp, we implemented a sharded database strategy coupled with a robust message queue to manage...',
        })

        async function startSession() {
            try {
                if (!cameraOn) await startCamera()
                if (!micOn) await startMic()
                wsService.onConnect(() => setIsConnected(true))
                wsService.onDisconnect(() => setIsConnected(false))
                wsService.onMessage((msg) => {
                    if (msg.type === 'transcript') {
                        addTranscript({ id: Date.now().toString(), timestamp: msg.timestamp, speaker: msg.speaker, text: msg.text })
                        if (msg.speaker === 'ai') setCurrentQuestion(msg.text)
                    }
                    if (msg.type === 'inlineData') audioPlaybackService.playBase64Chunk(msg.data)
                })
                wsService.connect(sessionId)
            } catch { /* media or ws error */ }
        }

        startSession()
        return () => { clearInterval(timer); wsService.disconnect(); audioPlaybackService.stop() }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="text-slate-100 h-screen overflow-hidden flex flex-col bg-[#0d0d0d]">
            {/* Top bar */}
            <header className="h-14 px-6 flex items-center justify-between border-b border-primary/20 bg-[#12100d] z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Session in Progress</span>
                    <div className="h-4 w-px bg-primary/20" />
                    <h2 className="text-sm font-semibold tracking-tight text-white">
                        Senior Product Architect <span className="text-slate-500 font-light mx-1">|</span> Alexander Pierce
                    </h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-primary/60 font-medium">Elapsed</span>
                        <span className="text-sm font-mono tracking-widest tabular-nums text-white">{formatTime(elapsedSeconds)}</span>
                    </div>
                    <button onClick={handleEndSession} className="h-8 px-4 border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 rounded">
                        <span className="material-symbols-outlined text-sm">call_end</span> End
                    </button>
                </div>
            </header>

            {/* Video preview — top half */}
            <div className="relative h-[50%] bg-black shrink-0 overflow-hidden">
                <video ref={videoRef} className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} muted playsInline />
                {cameraOn && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />}
                {!cameraOn && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-600">
                        <span className="material-symbols-outlined text-6xl">videocam_off</span>
                        <p className="text-sm font-medium uppercase tracking-wider">Camera is off</p>
                        <button onClick={toggleCamera} className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded hover:bg-primary/20 transition-colors">Enable Camera</button>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0d0d] pointer-events-none" />
                {cameraOn && (
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-primary/30">
                            <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter text-primary">Face Tracking: Active</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-primary/30">
                            <div className="size-1.5 bg-primary rounded-full" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter text-primary">Eye Contact: Locked</span>
                        </div>
                    </div>
                )}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 z-10">
                    <button onClick={toggleCamera} className={`backdrop-blur-md p-2.5 rounded-full transition-colors border ${cameraOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                        <span className="material-symbols-outlined text-lg">{cameraOn ? 'videocam' : 'videocam_off'}</span>
                    </button>
                    <button onClick={toggleMic} className={`backdrop-blur-md p-2.5 rounded-full transition-colors border ${micOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                        <span className="material-symbols-outlined text-lg">{micOn ? 'mic' : 'mic_off'}</span>
                    </button>
                </div>
                <div className="absolute bottom-6 left-6 z-10">
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded border border-white/10 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Alexander P.</span>
                    </div>
                </div>
            </div>

            {/* Bottom half */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center relative px-8">
                    <div className="relative w-full max-w-3xl flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-around opacity-30">
                            {[12, 24, 32, 48, 64, 40, 56, 32, 48, 24, 16].map((ht, i) => (
                                <div key={i} className="w-0.5 bg-primary rounded-full transition-all duration-300" style={{ height: `${ht * (0.3 + Math.random() * 0.4)}px`, opacity: 0.2 + (ht / 64) * 0.8 }} />
                            ))}
                        </div>
                        <div className="z-10 text-center py-6">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3 opacity-80">Owlyn AI Core</div>
                            <div className="text-xl font-light italic text-slate-300 max-w-xl mx-auto leading-relaxed">"{currentQuestion}"</div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-primary/10 bg-[#12100d] px-6 py-4 max-h-32 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        {transcript.map((entry) => (
                            <div key={entry.id} className="flex gap-3">
                                <span className={`font-bold text-[10px] uppercase mt-0.5 w-8 shrink-0 ${entry.speaker === 'ai' ? 'text-primary' : 'text-slate-500'}`}>
                                    {entry.speaker === 'ai' ? 'AI' : 'YOU'}
                                </span>
                                <p className={`text-sm leading-relaxed ${entry.speaker === 'ai' ? 'text-slate-300' : 'text-slate-500 italic'}`}>{entry.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-8 border-t border-primary/10 bg-[#0a0a08] px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className={`size-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{isConnected ? 'Connected' : 'Connecting...'}</span>
                        </div>
                        <div className="h-3 w-px bg-primary/10" />
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary/40 text-xs">verified_user</span>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Integrity 98%</span>
                        </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-600">Owlyn Genesis v4.0</span>
                </div>
            </div>
        </div>
    )
}
