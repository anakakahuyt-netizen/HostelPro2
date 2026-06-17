import { isDev } from '../utils/isDev.js';
// Electron builder and packaging configuration placeholders.
// These values will be used by electron-builder when it's installed and integrated.
export const buildConfig = {
    appId: 'com.hostelpro.app',
    productName: 'HostelPro',
    executableName: 'hostelpro',
    directories: {
        buildResources: 'electron/assets',
        output: 'dist-electron',
    },
    files: [
        'dist/**/*',
        'electron/**/*',
        'package.json',
    ],
    win: {
        target: ['nsis', 'portable'],
    },
    mac: {
        target: ['dmg', 'zip'],
    },
    linux: {
        target: ['AppImage', 'deb'],
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
    },
};
export function getIconPath() {
    // TODO: create icon files in electron/assets/icon.{png,ico,icns}
    return 'electron/assets/icon.png';
}
export function getOutputDir() {
    return buildConfig.directories.output;
}
export function getAppId() {
    return buildConfig.appId;
}
export function getProductName() {
    return isDev ? `${buildConfig.productName} (Dev)` : buildConfig.productName;
}
// TODO: export this config to electron-builder.json when electron-builder is installed.
//# sourceMappingURL=buildConfig.js.map