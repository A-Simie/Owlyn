import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  Menu,
  safeStorage,
  clipboard,
  desktopCapturer,
  screen,
} from "electron";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { createLogger } from "../shared/logger";

const log = createLogger("main");
const IS_DEV = !app.isPackaged;

// Enable Chromium's Shape Detection API (FaceDetector)
app.commandLine.appendSwitch("enable-experimental-web-platform-features");

if (IS_DEV) {
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
}

let mainWindow: BrowserWindow | null = null;
let isLockdownActive = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: !IS_DEV,
      webSecurity: !IS_DEV,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
    if (IS_DEV) {
      mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
    log.info("Main window ready");
  });

  mainWindow.on("blur", () => {
    if (isLockdownActive) {
      mainWindow?.webContents.send("lockdown:blur");
      log.warn("Main window blurred - possible environment breach");
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      const allowed = [
        "media",
        "mediaKeySystem",
        "display-capture",
        "camera",
        "microphone",
      ];
      return allowed.includes(permission);
    },
  );

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = [
        "media",
        "mediaKeySystem",
        "display-capture",
        "camera",
        "microphone",
      ];
      callback(allowed.includes(permission));
    },
  );

  // Handle Display Media (Screen Selection)
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    const { desktopCapturer } = require("electron");
    desktopCapturer.getSources({ types: ["screen", "window"] }).then((sources: any[]) => {
  
      if (sources.length > 0) {
        callback({ video: sources[0] });
      } else {
        callback({});
      }
    });
  });

  if (!IS_DEV) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.ngrok-free.app wss://*.ngrok-free.app;",
          ],
        },
      });
    });
  }

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handlers
ipcMain.handle("platform:info", () => ({
  platform: process.platform,
  arch: process.arch,
  version: app.getVersion(),
}));

ipcMain.handle("platform:display-count", () => {
  return screen.getAllDisplays().length;
});

ipcMain.handle("session:generate-id", () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
});

ipcMain.on("window:minimize", () => mainWindow?.minimize());
ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on("window:close", () => mainWindow?.close());

ipcMain.handle("auth:get-token", () => {
  const path = join(app.getPath("userData"), "token.dat");
  if (existsSync(path)) {
    try {
      const encrypted = readFileSync(path);
      return safeStorage.decryptString(encrypted);
    } catch {
      return null;
    }
  }
  return null;
});

ipcMain.handle("auth:set-token", (_event, token: string) => {
  const path = join(app.getPath("userData"), "token.dat");
  if (token) {
    const encrypted = safeStorage.encryptString(token);
    writeFileSync(path, encrypted);
  } else if (existsSync(path)) {
    unlinkSync(path);
  }
  return true;
});

ipcMain.handle("lockdown:toggle", (_event, enabled: boolean) => {
  if (!mainWindow) return false;

  isLockdownActive = enabled;
  log.info(`Lockdown mode: ${enabled ? "ENABLED" : "DISABLED"}`);

  if (enabled) {
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.setContentProtection(true);
  } else {
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setContentProtection(false);
  }
  return true;
});

ipcMain.handle("window:set-widget-mode", (_event, enabled: boolean) => {
  if (!mainWindow) return false;

  if (enabled) {
    // Widget Mode: Small, Always on Top, Bottom-Right
    const { screen } = require("electron");
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    // Clear all hard constraints from constructor
    mainWindow.setMinimumSize(0, 0);
    mainWindow.setMaximumSize(10000, 10000);
    
    mainWindow.setMaximizable(true);
    mainWindow.setFullScreen(false);
    mainWindow.setResizable(true);
    
    // Set actual bounds - instant resize (no animation to prevent jumping)
    mainWindow.setMinimumSize(240, 280);
    mainWindow.setBounds({
      x: width - 260,
      y: height - 320,
      width: 240,
      height: 280
    });
    
    mainWindow.setAlwaysOnTop(true, "floating");
    mainWindow.setMinimizable(true);
  } else {
    // Restore: Large, Center
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(1024, 700);
    mainWindow.setMaximumSize(10000, 10000);
    mainWindow.setSize(1440, 900, true);
    mainWindow.center();
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMinimizable(true);
    mainWindow.setMaximizable(true);
  }
  return true;
});

ipcMain.handle("desktop:sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 400, height: 250 },
      fetchWindowIcons: false
    });
    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
    }));
  } catch (err) {
    console.error("Failed to get desktop sources:", err);
    return [];
  }
});

ipcMain.on("clipboard:write", (_event, text: string) => {
  clipboard.writeText(text);
  log.info("Native clipboard write successful");
});
