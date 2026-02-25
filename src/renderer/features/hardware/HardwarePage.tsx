import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMediaStore } from '@/stores/media.store'

type NetworkStatus = {
    latencyMs: number | null
    stability: number | null
    status: 'testing' | 'excellent' | 'good' | 'poor' | 'idle'
}

export default function HardwarePage() {
    const navigate = useNavigate()
    const videoRef = useRef<HTMLVideoElement>(null)
    const { cameraOn, micOn, cameraStream, audioLevel, cameraError, micError, startCamera, stopCamera, startMic, stopMic } = useMediaStore()

    const [network, setNetwork] = useState<NetworkStatus>({ latencyMs: null, stability: null, status: 'idle' })

    const toggleCamera = useCallback(async () => {
        if (cameraOn) { stopCamera(); return }
        await startCamera()
    }, [cameraOn, stopCamera, startCamera])

    const toggleMic = useCallback(async () => {
        if (micOn) { stopMic(); return }
        await startMic()
    }, [micOn, stopMic, startMic])

    // Sync video element with camera stream
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = cameraStream
            if (cameraStream) videoRef.current.play().catch(() => { })
        }
    }, [cameraStream])

    const runNetworkTest = useCallback(async () => {
        setNetwork({ latencyMs: null, stability: null, status: 'testing' })
        const pings: number[] = []
        const target = import.meta.env.VITE_API_BASE_URL || 'https://www.google.com'

        for (let i = 0; i < 5; i++) {
            const start = performance.now()
            try {
                await fetch(target, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
                pings.push(Math.round(performance.now() - start))
            } catch {
                pings.push(-1)
            }
            await new Promise((r) => setTimeout(r, 200))
        }

        const valid = pings.filter((p) => p >= 0)
        if (valid.length === 0) {
            setNetwork({ latencyMs: null, stability: null, status: 'poor' })
            return
        }

        const avgLatency = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
        const stabilityPct = Math.round((valid.length / pings.length) * 100)
        const status = avgLatency < 100 ? 'excellent' : avgLatency < 300 ? 'good' : 'poor'

        setNetwork({ latencyMs: avgLatency, stability: stabilityPct, status })
    }, [])

    const canProceed = cameraOn && micOn

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#1e1a14] text-slate-100">
            <header className="flex items-center justify-between border-b border-primary/20 px-6 py-4 lg:px-20 bg-[#12100d]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="text-primary">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Owlyn</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs uppercase tracking-widest text-primary/60 font-semibold">Scheduled Interview</span>
                        <span className="text-sm font-medium text-white">Senior Product Designer</span>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 lg:px-20">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left panel */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-8">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
                                Let's get you <span className="text-primary italic">ready</span>.
                            </h2>
                            <p className="text-slate-400 text-lg max-w-sm">
                                Ensure your hardware is calibrated for the best interview experience. Toggle each device below.
                            </p>
                        </div>

                        <div className="space-y-4 bg-[#0d0d0d] border border-primary/20 p-6 rounded-xl">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">System Readiness</h3>

                            {/* Camera Toggle */}
                            <button onClick={toggleCamera} className="w-full flex items-center gap-3 py-3 px-1 hover:bg-primary/5 rounded transition-colors text-left group">
                                <span className={`material-symbols-outlined text-xl ${cameraOn ? 'text-green-500' : 'text-slate-500 group-hover:text-primary/60'}`}>
                                    {cameraOn ? 'videocam' : 'videocam_off'}
                                </span>
                                <span className="text-sm font-medium text-slate-300 flex-1">
                                    {cameraOn ? 'Camera active' : cameraError || 'Click to enable camera'}
                                </span>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${cameraOn ? 'bg-green-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cameraOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </div>
                            </button>

                            {/* Mic Toggle */}
                            <button onClick={toggleMic} className="w-full flex items-center gap-3 py-3 px-1 hover:bg-primary/5 rounded transition-colors text-left group">
                                <span className={`material-symbols-outlined text-xl ${micOn ? 'text-green-500' : 'text-slate-500 group-hover:text-primary/60'}`}>
                                    {micOn ? 'mic' : 'mic_off'}
                                </span>
                                <span className="text-sm font-medium text-slate-300 flex-1">
                                    {micOn ? 'Microphone active' : micError || 'Click to enable microphone'}
                                </span>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${micOn ? 'bg-green-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${micOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </div>
                            </button>

                            {/* Network Test */}
                            <button onClick={runNetworkTest} className="w-full flex items-center gap-3 py-3 px-1 hover:bg-primary/5 rounded transition-colors text-left group">
                                <span className={`material-symbols-outlined text-xl ${network.status === 'excellent' || network.status === 'good' ? 'text-green-500' : network.status === 'poor' ? 'text-red-500' : network.status === 'testing' ? 'text-yellow-500 animate-spin' : 'text-slate-500 group-hover:text-primary/60'}`}>
                                    {network.status === 'testing' ? 'sync' : 'wifi'}
                                </span>
                                <span className="text-sm font-medium text-slate-300 flex-1">
                                    {network.status === 'idle' && 'Click to run network test'}
                                    {network.status === 'testing' && 'Testing connection...'}
                                    {network.status === 'excellent' && `Network excellent (${network.latencyMs}ms)`}
                                    {network.status === 'good' && `Network good (${network.latencyMs}ms)`}
                                    {network.status === 'poor' && 'Network poor or unreachable'}
                                </span>
                                {(network.status === 'excellent' || network.status === 'good') && (
                                    <span className="text-xs text-green-500 font-bold">{network.stability}%</span>
                                )}
                            </button>

                            <div className="mt-4 pt-4 border-t border-primary/10">
                                <a className="text-xs text-primary/60 hover:text-primary underline underline-offset-4 flex items-center gap-1 transition-colors" href="#">
                                    <span className="material-symbols-outlined text-sm">help</span>
                                    Need help with setup?
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right panel */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Video Preview */}
                        <div className="bg-[#0d0d0d] border border-primary/20 rounded-xl overflow-hidden glow-gold group">
                            <div className="relative aspect-video bg-black flex items-center justify-center">
                                <video ref={videoRef} className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} muted playsInline autoPlay />
                                {!cameraOn && (
                                    <div className="flex flex-col items-center gap-4 text-slate-600">
                                        <span className="material-symbols-outlined text-6xl">videocam_off</span>
                                        <p className="text-sm font-medium uppercase tracking-wider">Camera is off</p>
                                        <button onClick={toggleCamera} className="mt-2 px-6 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded hover:bg-primary/20 transition-colors">
                                            Enable Camera
                                        </button>
                                    </div>
                                )}
                                {cameraOn && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-xs font-bold uppercase tracking-tighter text-white">Live Preview</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-6 bg-[#12100d]">
                                <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Visual Input Source</label>
                                <select className="w-full bg-[#1e1a14]/50 border border-primary/20 rounded-lg text-white py-3 px-4 focus:ring-primary focus:border-primary transition-all">
                                    <option>Integrated HD Camera</option>
                                    <option>External USB Cam (4K)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mic Level */}
                            <div className="bg-[#0d0d0d] border border-primary/20 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Microphone Check</h3>
                                    <button onClick={toggleMic} className="text-primary hover:text-primary/80 transition-colors">
                                        <span className="material-symbols-outlined">{micOn ? 'mic' : 'mic_off'}</span>
                                    </button>
                                </div>
                                <div className="h-4 w-full bg-background-dark rounded-full overflow-hidden mb-4 border border-white/5">
                                    <div
                                        className="h-full meter-bar transition-all duration-150"
                                        style={{ width: micOn ? `${Math.max(2, Math.round(audioLevel * 100))}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                                    <span>Silent</span>
                                    <span className="text-primary">Optimal</span>
                                    <span>Loud</span>
                                </div>
                                {!micOn && (
                                    <p className="mt-3 text-xs text-slate-600 italic text-center">Enable microphone to see audio levels</p>
                                )}
                            </div>

                            {/* Network */}
                            <div className="bg-[#0d0d0d] border border-primary/20 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Connection Check</h3>
                                    <button onClick={runNetworkTest} className="text-primary hover:text-primary/80 transition-colors">
                                        <span className={`material-symbols-outlined ${network.status === 'testing' ? 'animate-spin' : ''}`}>
                                            {network.status === 'testing' ? 'sync' : 'wifi'}
                                        </span>
                                    </button>
                                </div>
                                {network.status === 'idle' ? (
                                    <div className="flex flex-col items-center py-4 gap-3">
                                        <span className="material-symbols-outlined text-3xl text-slate-600">speed</span>
                                        <button onClick={runNetworkTest} className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded hover:bg-primary/20 transition-colors">
                                            Run Test
                                        </button>
                                    </div>
                                ) : network.status === 'testing' ? (
                                    <div className="flex flex-col items-center py-4 gap-3">
                                        <span className="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Measuring latency...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-background-dark/50 rounded-lg border border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Latency</p>
                                                <p className="text-xl font-bold text-white">{network.latencyMs ?? '—'}<span className="text-xs text-slate-400 ml-1">ms</span></p>
                                            </div>
                                            <div className="text-center p-3 bg-background-dark/50 rounded-lg border border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Stability</p>
                                                <p className={`text-xl font-bold ${network.status === 'excellent' ? 'text-green-500' : network.status === 'good' ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {network.stability ?? '—'}<span className="text-xs text-slate-400 ml-1">%</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                                            <span className={`size-2 rounded-full ${network.status === 'excellent' ? 'bg-green-500' : network.status === 'good' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                            {network.status === 'excellent' && 'Ready for High-Definition stream'}
                                            {network.status === 'good' && 'Acceptable for standard stream'}
                                            {network.status === 'poor' && 'Connection unstable — retry recommended'}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Network advisory */}
                        {network.status === 'poor' && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-400 mt-0.5">warning</span>
                                <div>
                                    <p className="text-sm font-bold text-red-400 mb-1">Unstable Connection Detected</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Your network may cause audio/video glitches during the interview. You may proceed at your discretion, or find a more stable connection first.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Enter */}
                        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-start gap-3 max-w-sm">
                                <span className="material-symbols-outlined text-primary mt-1">info</span>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    By entering the interview, you agree to our recording terms. Your data is processed securely and encrypted end-to-end.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/lobby')}
                                disabled={!canProceed}
                                className="w-full md:w-auto px-12 py-4 bg-primary text-black font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                Enter Interview
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 border-t border-primary/10 px-6 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-500 text-sm">© 2024 Owlyn AI Systems. All rights reserved.</p>
                <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-600">
                    <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                    <a className="hover:text-primary transition-colors" href="#">Security</a>
                    <a className="hover:text-primary transition-colors" href="#">Support</a>
                </div>
            </footer>
        </div>
    )
}
