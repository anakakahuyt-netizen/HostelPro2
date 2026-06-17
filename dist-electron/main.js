import { app, BrowserWindow } from 'electron';
import { registerBoarderHandlers } from './ipc/boarderHandlers';
import { registerRoomHandlers } from './ipc/roomHandlers';
import { registerPaymentHandlers } from './ipc/paymentHandlers';
import { getLoadTarget, getPreloadPath } from './config/windowConfig';
import { getUserDataPath } from './config/appConfig';
import { setupGracefulShutdown } from './services/lifecycleService';
import { initializeDatabase } from './services/databaseService';
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        ...getLoadTarget(),
        width: 1200,
        height: 800,
        webPreferences: {
            preload: getPreloadPath(__dirname),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    const loadTarget = getLoadTarget();
    if ('url' in loadTarget) {
        mainWindow.loadURL(loadTarget.url);
    }
    else {
        mainWindow.loadFile(loadTarget.file);
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
const userDataPath = getUserDataPath();
// TODO: store the SQLite database file under userDataPath, e.g. `${userDataPath}/hostel-pro.sqlite3`
app.whenReady().then(() => {
    // TODO: schema creation and migrations will occur here after initializeDatabase()
    initializeDatabase();
    registerBoarderHandlers();
    registerRoomHandlers();
    registerPaymentHandlers();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
setupGracefulShutdown();
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// TODO: when moving to SQLite, register new ipcMain handlers here
// and replace databaseAdapter with the SQLite-backed implementation.
//# sourceMappingURL=main.js.map