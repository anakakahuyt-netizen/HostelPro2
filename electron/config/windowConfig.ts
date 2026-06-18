import path from 'path'
import { fileURLToPath } from 'url'
import { getPreloadPath, getIndexHtmlPath } from '../utils/paths.js'
import { isDev } from '../utils/isDev.js'
import type { BrowserWindowConstructorOptions } from 'electron'

// baseDir should be the electron/ directory, not config/
// import.meta.url points to config/windowConfig.ts, so go up one level
const baseDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

export const windowOptions: BrowserWindowConstructorOptions = {
  width: 1200,
  height: 800,
  webPreferences: {
    preload: getPreloadPath(baseDir),
    contextIsolation: true,
    nodeIntegration: false,
  },
}

export function getLoadTarget(): { url: string } | { file: string } {
  if (isDev) {
    return { url: process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173' }
  }

  return { file: getIndexHtmlPath(baseDir) }
}

export { getPreloadPath }

// TODO: add window configuration for Electron builder, such as icon and webPreferences tweaks.
