import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  Menu,
  safeStorage,
  clipboard,
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
  isMac: process.platform === "darwin",
  version: app.getVersion(),
}));

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
    
    mainWindow.setSize(380, 520, true);
    mainWindow.setPosition(width - 400, height - 540, true);
    mainWindow.setAlwaysOnTop(true, "floating");
    mainWindow.setResizable(false);
    mainWindow.setMinimizable(false);
  } else {
    // Restore: Large, Center
    mainWindow.setResizable(true);
    mainWindow.setMinimizable(true);
    mainWindow.setSize(1440, 900, true);
    mainWindow.center();
    mainWindow.setAlwaysOnTop(false);
  }
  return true;
});

ipcMain.handle("desktop:sources", async () => {
  const { desktopCapturer } = require("electron");
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: { width: 300, height: 200 },
  });
  return sources.map(
    (s: {
      id: string;
      name: string;
      thumbnail: { toDataURL: () => string };
    }) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
    }),
  );
});

ipcMain.on("clipboard:write", (_event, text: string) => {
  clipboard.writeText(text);
  log.info("Native clipboard write successful");
});
