/// <reference types="vite/client" />
import type { OwlynAPI } from '../preload/preload'

declare global {
    interface Window {
        owlyn: OwlynAPI
    }
}

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_WS_URL: string
}
