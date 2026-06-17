import { contextBridge, ipcRenderer } from 'electron';
// Expose a safe Electron API to the renderer process.
// The actual IPC implementation can be changed later during migration.
contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    sendSync: (channel, ...args) => ipcRenderer.sendSync(channel, ...args),
    on: (channel, listener) => {
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    },
});
globalThis.addEventListener('error', (event) => {
    try {
        ipcRenderer.send('renderer-error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: (event.error && event.error.stack) || null,
        });
    }
    catch (e) {
        // ignore
    }
});
globalThis.addEventListener('unhandledrejection', (event) => {
    try {
        const reason = event.reason;
        ipcRenderer.send('renderer-unhandledrejection', {
            reason: reason && reason.stack ? reason.stack : String(reason),
        });
    }
    catch (e) {
        // ignore
    }
});
//# sourceMappingURL=preload.js.map