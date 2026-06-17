import path from 'path';
export function getPreloadPath(baseDir) {
    // Ensure Electron loads the CommonJS preload when package.json is ESM.
    return path.join(baseDir, 'preload.cjs');
}
export function getIndexHtmlPath(baseDir) {
    return path.join(baseDir, '../dist/index.html');
}
// Later, when SQLite is enabled, the database file can be stored under
// app.getPath('userData') in a file like `hostel-pro.sqlite3`.
//# sourceMappingURL=paths.js.map