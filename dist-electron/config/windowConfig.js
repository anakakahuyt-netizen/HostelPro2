import path from 'path';
import { getPreloadPath, getIndexHtmlPath } from '../utils/paths';
import { isDev } from '../utils/isDev';
export const windowOptions = {
    width: 1200,
    height: 800,
    webPreferences: {
        preload: getPreloadPath(path.dirname(new URL(import.meta.url).pathname)),
        contextIsolation: true,
        nodeIntegration: false,
    },
};
export function getLoadTarget() {
    if (isDev) {
        return { url: 'http://localhost:5173' };
    }
    return { file: getIndexHtmlPath(path.dirname(new URL(import.meta.url).pathname)) };
}
// TODO: add window configuration for Electron builder, such as icon and webPreferences tweaks.
//# sourceMappingURL=windowConfig.js.map