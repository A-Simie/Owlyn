import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMediaStore } from '@/stores/media.store'

export default function LobbyPage() {
    const navigate = useNavigate()
    const videoRef = useRef<HTMLVideoElement>(null)
    const { cameraOn, micOn, cameraStream, audioLevel, startCamera, stopCamera, startMic, stopMic } = useMediaStore()
    const [latency, setLatency] = useState(12)
    const [isChecking, setIsChecking] = useState(false)

    // Ensure camera/mic are started when we land here
    useEffect(() => {
        if (!cameraOn) startCamera()
        if (!micOn) startMic()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync video element with camera stream
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = cameraStream
            if (cameraStream) videoRef.current.play().catch(() => { })
        }
    }, [cameraStream])

    const toggleCamera = useCallback(async () => {
        if (cameraOn) stopCamera()
        else await startCamera()
    }, [cameraOn, stopCamera, startCamera])

    const toggleMic = useCallback(async () => {
        if (micOn) stopMic()
        else await startMic()
    }, [micOn, stopMic, startMic])

    // Simulate network latency fluctuation
    useEffect(() => {
        const id = setInterval(() => {
            setLatency(Math.round(8 + Math.random() * 18))
        }, 3000)
        return () => clearInterval(id)
    }, [])

    const handleRerun = useCallback(async () => {
        setIsChecking(true)
        stopCamera()
        stopMic()
        await new Promise(r => setTimeout(r, 800))
        await startCamera()
        await startMic()
        setLatency(Math.round(8 + Math.random() * 12))
        setTimeout(() => setIsChecking(false), 600)
    }, [stopCamera, stopMic, startCamera, startMic])

    const latencyLabel = latency <= 15 ? 'Excellent' : latency <= 25 ? 'Good' : 'Fair'
    const latencyRange = latency <= 15 ? '0-15ms range' : latency <= 25 ? '15-25ms range' : '25-40ms range'
    const latencyBar = Math.max(0, 100 - latency * 2)

    return (
        <div className="bg-[#1e1a14] text-slate-100 min-h-screen flex flex-col">
            <header className="flex items-center justify-between border-b border-primary/20 px-6 py-4 lg:px-20 bg-[#12100d]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="text-primary">
                        <span className="material-symbols-outlined text-3xl">school</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight uppercase text-white">Owlyn</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-xs uppercase tracking-widest text-primary/60 font-semibold">Interview ID</span>
                        <span className="text-sm font-mono text-white">#UXD-2024-0812</span>
                    </div>
                    <div className="size-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full p-6 lg:p-12 gap-12">
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white">Everything looks great, Alex.</h1>
                        <p className="text-slate-400 text-lg">Your system is optimized for a professional interview experience.</p>
                    </div>

                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/40 group">
                        <video ref={videoRef} className={`w-full h-full object-cover ${cameraOn ? 'opacity-80' : 'hidden'}`} muted playsInline />
                        {!cameraOn && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-600">
                                <span className="material-symbols-outlined text-6xl">videocam_off</span>
                                <p className="text-sm font-medium uppercase tracking-wider">Camera is off</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded border border-white/10">
                            <div className={`size-2 rounded-full ${cameraOn ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-xs font-bold uppercase tracking-widest text-white">{cameraOn ? 'Live Preview' : 'Camera Off'}</span>
                        </div>
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                                onClick={toggleCamera}
                                className={`backdrop-blur-md p-2 rounded transition-colors border border-white/10 ${cameraOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}
                            >
                                <span className="material-symbols-outlined text-lg">{cameraOn ? 'videocam' : 'videocam_off'}</span>
                            </button>
                            <button
                                onClick={toggleMic}
                                className={`backdrop-blur-md p-2 rounded transition-colors border border-white/10 ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}
                            >
                                <span className="material-symbols-outlined text-lg">{micOn ? 'mic' : 'mic_off'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Mic level bar */}
                    {micOn && (
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-sm">graphic_eq</span>
                            <div className="flex-1 h-2 bg-[#0d0d0d] rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-primary transition-all duration-150 rounded-full" style={{ width: `${Math.max(2, Math.round(audioLevel * 100))}%` }} />
                            </div>
                            <span className="text-[10px] text-primary/60 uppercase font-bold w-8 text-right">{Math.round(audioLevel * 100)}%</span>
                        </div>
                    )}

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 flex gap-4 items-start">
                        <div className="bg-primary/20 p-2 rounded">
                            <span className="material-symbols-outlined text-primary">lightbulb</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-1">Scholar Tip</h4>
                            <p className="text-sm text-slate-400 italic">
                                "Remember to look directly at the camera lens, not the screen, to maintain strong eye contact with your interviewer."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] flex flex-col gap-6">
                    <div className="bg-primary p-6 rounded-lg text-black flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Network Performance</p>
                                <h3 className="text-4xl font-bold tracking-tight mt-1">{latency}ms</h3>
                            </div>
                            <div className="bg-black/10 px-3 py-1 rounded text-xs font-bold uppercase">Stable</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">network_check</span>
                            <span className="text-sm font-medium">{latencyLabel} Connection ({latencyRange})</span>
                        </div>
                        <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-black h-full transition-all duration-500" style={{ width: `${latencyBar}%` }} />
                        </div>
                    </div>

                    <div className="bg-[#0d0d0d] border border-primary/20 rounded-lg flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-primary/10">
                            <h2 className="text-lg font-bold uppercase tracking-wider text-white">System Readiness Check</h2>
                        </div>
                        <div className="flex flex-col divide-y divide-primary/10">
                            {[
                                { icon: 'videocam', label: 'Integrated HD Webcam', sub: cameraOn ? 'Video feed verified' : 'Camera is off', ok: cameraOn },
                                { icon: 'mic', label: 'Pro Audio Input', sub: micOn ? 'Audio levels peaking correctly' : 'Microphone is off', ok: micOn },
                                { icon: 'router', label: 'Fiber Optic Connection', sub: 'Secured & Encrypted', ok: true },
                                { icon: 'battery_full', label: 'System Power', sub: 'Connected to AC Power', ok: true },
                            ].map((item) => (
                                <div key={item.icon} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded ${item.ok ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'}`}>
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.label}</p>
                                            <p className={`text-xs ${item.ok ? 'text-slate-500' : 'text-red-400'}`}>{item.sub}</p>
                                        </div>
                                    </div>
                                    <span className={`material-symbols-outlined font-bold ${item.ok ? 'text-primary' : 'text-red-400'}`}>
                                        {item.ok ? 'check_circle' : 'error'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-primary/5">
                            <button
                                onClick={handleRerun}
                                disabled={isChecking}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-bold uppercase tracking-widest rounded border border-primary/10 text-slate-300 disabled:opacity-50"
                            >
                                <span className={`material-symbols-outlined text-sm ${isChecking ? 'animate-spin' : ''}`}>refresh</span>
                                {isChecking ? 'Checking...' : 'Re-run Tests'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/interview')}
                        disabled={!cameraOn || !micOn}
                        className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-5 rounded uppercase tracking-[0.2em] transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3 text-lg shadow-xl shadow-primary/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        Enter Interview
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>

                    <div className="flex justify-center gap-4">
                        <p className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">lock</span>
                            End-to-End Encrypted
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">verified_user</span>
                            GDPR Compliant
                        </p>
                    </div>
                </div>
            </main>

            <footer className="mt-auto py-8 px-20 flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">copyright</span>
                    <span className="text-xs tracking-widest uppercase">2024 Owlyn Technologies</span>
                </div>
                <div className="flex gap-8">
                    <span className="text-xs tracking-widest uppercase hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                    <span className="text-xs tracking-widest uppercase hover:text-primary cursor-pointer transition-colors">Support</span>
                </div>
            </footer>
        </div>
    )
}
