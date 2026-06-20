import path from 'path'

export function getPreloadPath(baseDir: string): string {
  // Use a CommonJS preload output so Electron can load it when
  // package.json is set to "type": "module" and main remains ESM.
  return path.join(baseDir, 'preload.cjs')
}

export function getIndexHtmlPath(baseDir: string): string {
  // baseDir is dist-electron/electron, go up 2 levels to root, then to dist
  return path.join(baseDir, '../../dist/index.html')
}

// Later, when SQLite is enabled, the database file can be stored under
// app.getPath('userData') in a file like `hostel-pro.sqlite3`.
