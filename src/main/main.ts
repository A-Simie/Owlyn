import { app, BrowserWindow, ipcMain, session, Menu } from 'electron'
import { join } from 'path'
import { createLogger } from '../shared/logger'

const log = createLogger('main')
const IS_DEV = !app.isPackaged

// Enable Chromium's Shape Detection API (FaceDetector)
app.commandLine.appendSwitch('enable-experimental-web-platform-features')

if (IS_DEV) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#0a0a0a',
        show: false,
        webPreferences: {
            preload: join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: !IS_DEV,
            webSecurity: !IS_DEV,
        },
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
        if (IS_DEV) {
            mainWindow?.webContents.openDevTools({ mode: 'detach' })
        }
        log.info('Main window ready')
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    if (process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null)

    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
        const allowed = ['media', 'mediaKeySystem', 'display-capture', 'camera', 'microphone']
        return allowed.includes(permission)
    })

    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        const allowed = ['media', 'mediaKeySystem', 'display-capture', 'camera', 'microphone']
        callback(allowed.includes(permission))
    })

    if (!IS_DEV) {
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src 'self'; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                        "font-src 'self' https://fonts.gstatic.com; " +
                        "img-src 'self' data: https: blob:; " +
                        "media-src 'self' blob:; " +
                        "connect-src 'self' ws://localhost:* http://localhost:*;"
                    ],
                },
            })
        })
    }

    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

function registerIpcHandlers(): void {
    ipcMain.handle('platform:info', () => ({
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
    }))

    ipcMain.handle('session:generate-id', () => {
        return `OWL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    })

    ipcMain.handle('window:minimize', () => mainWindow?.minimize())
    ipcMain.handle('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow?.maximize()
        }
    })
    ipcMain.handle('window:close', () => mainWindow?.close())

    log.info('IPC handlers registered')
}
