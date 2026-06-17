import { contextBridge, ipcRenderer } from 'electron';
// Expose a safe Electron API to the renderer process.
// The actual IPC implementation can be changed later during migration.
contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, listener) => {
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    },
});
//# sourceMappingURL=preload.js.map