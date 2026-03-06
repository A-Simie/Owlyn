// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
var __electron_vite_injected_dirname = "C:\\Users\\HP\\OneDrive\\Documents\\projects\\Owlyn";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          main: resolve(__electron_vite_injected_dirname, "src/main/main.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          preload: resolve(__electron_vite_injected_dirname, "src/preload/preload.ts")
        }
      }
    }
  },
  renderer: {
    plugins: [react()],
    root: resolve(__electron_vite_injected_dirname, "src/renderer"),
    build: {
      outDir: resolve(__electron_vite_injected_dirname, "dist/renderer"),
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/renderer/index.html")
        }
      }
    },
    resolve: {
      alias: {
        "@": resolve(__electron_vite_injected_dirname, "src/renderer"),
        "@shared": resolve(__electron_vite_injected_dirname, "src/shared")
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
