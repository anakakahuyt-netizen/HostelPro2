import { app } from 'electron';
import { closeDatabase } from './databaseService';
let mainWindow = null;
const singleInstanceLock = app.requestSingleInstanceLock();
export function isSingleInstance() {
    return Boolean(singleInstanceLock);
}
export function handleSecondInstance() {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });
}
export function setMainWindow(window) {
    mainWindow = window;
}
export function closeMainWindow() {
    if (mainWindow) {
        mainWindow.close();
    }
}
export function setupGracefulShutdown() {
    app.on('before-quit', () => {
        closeDatabase();
    });
}
// TODO: add auto-updater hooks and event handling in this service later.
//# sourceMappingURL=lifecycleService.js.map