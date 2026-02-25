import { contextBridge, ipcRenderer } from 'electron'

const api = {
    platform: {
        getInfo: (): Promise<{ platform: string; arch: string; version: string }> =>
            ipcRenderer.invoke('platform:info'),
    },
    session: {
        generateId: (): Promise<string> => ipcRenderer.invoke('session:generate-id'),
    },
    window: {
        minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
        maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
        close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    },
} as const

export type OwlynAPI = typeof api

contextBridge.exposeInMainWorld('owlyn', api)
