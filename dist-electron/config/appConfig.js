import { app } from 'electron';
import { isDev } from '../utils/isDev';
export function getUserDataPath() {
    return app.getPath('userData');
}
export function getAppName() {
    if (isDev) {
        return 'HostelPro (Dev)';
    }
    return 'HostelPro';
}
export function getEnvironment() {
    return isDev ? 'development' : 'production';
}
// TODO: add electron-builder configuration settings here, such as publish targets and appId.
//# sourceMappingURL=appConfig.js.map