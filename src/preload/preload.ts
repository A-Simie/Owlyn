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
    auth: {
        saveToken: (token: string): Promise<boolean> => ipcRenderer.invoke('auth:save-token', token),
        getToken: (): Promise<string | null> => ipcRenderer.invoke('auth:get-token'),
        clearToken: (): Promise<boolean> => ipcRenderer.invoke('auth:clear-token'),
    },
} as const

export type OwlynAPI = typeof api

contextBridge.exposeInMainWorld('owlyn', api)
