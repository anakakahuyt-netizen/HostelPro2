import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

// Expose a safe Electron API to the renderer process.
// The actual IPC implementation can be changed later during migration.
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  sendSync: (channel: string, ...args: unknown[]) => ipcRenderer.sendSync(channel, ...args),
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
})

// Forward renderer errors and unhandled rejections to main for debugging
;(globalThis as any).addEventListener('error', (event: any) => {
  try {
    ipcRenderer.send('renderer-error', {
      message: event.message,
      filename: (event as any).filename,
      lineno: (event as any).lineno,
      colno: (event as any).colno,
      stack: (event.error && (event.error as any).stack) || null,
    })
  } catch (e) {
    // ignore
  }
})

;(globalThis as any).addEventListener('unhandledrejection', (event: any) => {
  try {
    const reason = (event as any).reason
    ipcRenderer.send('renderer-unhandledrejection', {
      reason: reason && reason.stack ? reason.stack : String(reason),
    })
  } catch (e) {
    // ignore
  }
})
